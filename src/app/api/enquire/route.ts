import { NextResponse } from "next/server";
import { Resend } from "resend";
import { BRAND, SITE_URL } from "@/config/brand";
import { configToParams, formatAUD, priceLines, summaryRows, totalPrice } from "@/lib/configurator";
import { INTENTS, validateEnquiry, type Enquiry } from "@/lib/enquiry";

export const runtime = "nodejs";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function row(k: string, v: string) {
  return `<tr><td style="padding:8px 16px 8px 0;color:#7a756d;font-size:13px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;color:#262624;font-size:14px">${esc(v).replace(/\n/g, "<br>")}</td></tr>`;
}

function buildEmail(e: Enquiry) {
  const configUrl = e.config ? `${SITE_URL}/configure?${configToParams(e.config).toString()}` : null;
  const customer: [string, string][] = [
    ["Request", INTENTS[e.intent]],
    ["Name", e.name],
    ["Email", e.email],
    ["Phone", e.phone],
    ["Suburb", e.suburb],
    ["Dog breed", e.breed || "—"],
    ["Dog size", e.dogSize || "—"],
    ["Timing", e.timing || "—"],
    ["Notes", e.notes || "—"],
  ];
  const configRows = e.config ? summaryRows(e.config) : [];
  const price = e.config
    ? [...priceLines(e.config).map((l): [string, string] => [l.label, formatAUD(l.amount)]), ["Indicative total (inc. GST)", formatAUD(totalPrice(e.config))] as [string, string]]
    : [];

  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ee;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;padding:40px">
<tr><td style="font-family:Georgia,serif;letter-spacing:4px;font-size:14px;color:#262624">${esc(BRAND.name)}</td></tr>
<tr><td style="padding-top:28px;font-family:Georgia,serif;font-size:28px;color:#262624">${e.intent === "reserve" ? "Build slot reservation" : "New build enquiry"}</td></tr>
<tr><td style="padding-top:28px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7a756d">Customer</td></tr>
<tr><td><table cellpadding="0" cellspacing="0">${customer.map(([k, v]) => row(k, v)).join("")}</table></td></tr>
${
  e.config
    ? `<tr><td style="padding-top:28px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7a756d">Configuration</td></tr>
<tr><td><table cellpadding="0" cellspacing="0">${configRows.map(([k, v]) => row(k, v)).join("")}</table></td></tr>
<tr><td style="padding-top:28px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7a756d">Indicative price</td></tr>
<tr><td><table cellpadding="0" cellspacing="0">${price.map(([k, v]) => row(k, v)).join("")}</table></td></tr>
<tr><td style="padding-top:24px"><a href="${esc(configUrl!)}" style="color:#4a3426">Open this configuration in 3D</a></td></tr>`
    : `<tr><td style="padding-top:28px;color:#7a756d;font-size:14px">No configuration attached.</td></tr>`
}
</table></td></tr></table></body></html>`;

  const text = [
    `${e.intent === "reserve" ? "BUILD SLOT RESERVATION" : "NEW BUILD ENQUIRY"} — ${BRAND.name}`,
    "",
    ...customer.map(([k, v]) => `${k}: ${v}`),
    "",
    ...(e.config
      ? ["CONFIGURATION", ...configRows.map(([k, v]) => `${k}: ${v}`), "", "PRICE", ...price.map(([k, v]) => `${k}: ${v}`), "", `3D: ${configUrl}`]
      : ["No configuration attached."]),
  ].join("\n");

  const subject = `${e.intent === "reserve" ? "Build slot reservation" : "Build enquiry"}: ${e.name}, ${e.suburb}${
    e.config ? ` · ${formatAUD(totalPrice(e.config))}` : ""
  }`;
  return { html, text, subject };
}

function confirmationEmail(e: Enquiry) {
  const text = `Hi ${e.name.split(" ")[0]},

Thank you for your enquiry. We build a limited number of homes each month and give each one our full attention, so we'll be in touch ${BRAND.responseTime} to talk through your home and arrange a site visit.

${e.config ? `Your configuration: ${SITE_URL}/configure?${configToParams(e.config).toString()}\n\n` : ""}Kind regards,
${BRAND.name}`;
  const html = `<div style="font-family:Georgia,serif;color:#262624;font-size:16px;line-height:1.6;max-width:520px">${esc(text).replace(/\n/g, "<br>")}</div>`;
  return { subject: `Thank you — ${BRAND.name}`, text, html };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  // Honeypot: silently accept bot submissions without sending anything.
  if (body && typeof body === "object" && (body as Record<string, unknown>).company) {
    return NextResponse.json({ ok: true });
  }

  const result = validateEnquiry(body);
  if (!result.ok) {
    return NextResponse.json({ message: "Please check the highlighted fields.", errors: result.errors }, { status: 422 });
  }
  const enquiry = result.enquiry;
  const email = buildEmail(enquiry);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO_EMAIL;
  const from = process.env.ENQUIRY_FROM_EMAIL || `${BRAND.name} <onboarding@resend.dev>`;

  if (!apiKey || !to) {
    if (process.env.NODE_ENV !== "production") {
      // Local development without Resend configured: log the email instead.
      console.info(`\n[enquiry] RESEND_API_KEY / ENQUIRY_TO_EMAIL not set — email not sent.\nSubject: ${email.subject}\n\n${email.text}\n`);
      return NextResponse.json({ ok: true, dev: true });
    }
    console.error("[enquiry] Missing RESEND_API_KEY or ENQUIRY_TO_EMAIL");
    return NextResponse.json({ message: "Enquiries are temporarily unavailable. Please try again shortly." }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails
    .send({
      from,
      to: to.split(",").map((s) => s.trim()),
      replyTo: enquiry.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })
    .catch((err: unknown) => ({ error: err }));
  if (error) {
    console.error("[enquiry] Resend error", error);
    return NextResponse.json({ message: "We couldn’t send your enquiry just now. Please try again." }, { status: 502 });
  }

  if (process.env.SEND_CUSTOMER_CONFIRMATION === "true") {
    const c = confirmationEmail(enquiry);
    // A failed confirmation shouldn't fail the enquiry itself.
    await resend.emails.send({ from, to: enquiry.email, subject: c.subject, html: c.html, text: c.text }).catch((err) => {
      console.error("[enquiry] confirmation failed", err);
    });
  }

  return NextResponse.json({ ok: true });
}
