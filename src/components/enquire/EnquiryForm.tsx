"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { configToParams, formatAUD, summaryRows, totalPrice, type Config } from "@/lib/configurator";
import { DOG_SIZES, INTENTS, TIMINGS, type Enquiry, type Intent } from "@/lib/enquiry";
import { BRAND } from "@/config/brand";

type Errors = Partial<Record<keyof Enquiry, string>>;

export function EnquiryForm({ config, initialIntent }: { config: Config | null; initialIntent: Intent }) {
  const [intent, setIntent] = useState<Intent>(initialIntent);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setStatus("sending");
    setErrors({});
    try {
      const res = await fetch("/api/enquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, intent, config }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("sent");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (json.errors) setErrors(json.errors);
      setMessage(json.message || "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setMessage("We couldn’t send your enquiry. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="fade-in-slow max-w-xl py-10">
        <p className="eyebrow text-muted">Thank you</p>
        <h2 className="heading mt-5 text-5xl">Your enquiry is with us.</h2>
        <p className="lede mt-6">
          We’ll be in touch {BRAND.responseTime} to talk through your home and arrange a site visit.
          {intent === "reserve" && " We’ve noted that you’d like to reserve a build slot."}
        </p>
        <Link href="/" className="link-arrow mt-10">
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
      <form onSubmit={onSubmit} noValidate className="lg:col-span-7">
        {/* Intent */}
        <fieldset className="mb-12">
          <legend className="eyebrow mb-5 text-muted">I would like to</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(INTENTS) as Intent[]).map((k) => (
              <label
                key={k}
                className={`flex cursor-pointer items-center gap-3 border p-4 text-sm transition-colors duration-700 ${
                  intent === k ? "border-ink" : "border-line hover:border-stone"
                }`}
              >
                <input type="radio" name="intentChoice" value={k} checked={intent === k} onChange={() => setIntent(k)} className="accent-[#262624]" />
                {INTENTS[k]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
          <Field label="Name" error={errors.name}>
            <input name="name" className="field" autoComplete="name" required />
          </Field>
          <Field label="Email" error={errors.email}>
            <input name="email" type="email" className="field" autoComplete="email" inputMode="email" required />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input name="phone" type="tel" className="field" autoComplete="tel" inputMode="tel" required />
          </Field>
          <Field label="Suburb" error={errors.suburb}>
            <input name="suburb" className="field" autoComplete="address-level2" placeholder="e.g. Mosman" required />
          </Field>
          <Field label="Dog breed">
            <input name="breed" className="field" placeholder="e.g. Labrador" />
          </Field>
          <Field label="Dog size">
            <select name="dogSize" className="field" defaultValue={config ? (config.size === "M" ? DOG_SIZES[0] : DOG_SIZES[1]) : ""}>
              <option value="">Select</option>
              {DOG_SIZES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Preferred timing" className="sm:col-span-2">
            <select name="timing" className="field" defaultValue="">
              <option value="">Select</option>
              {TIMINGS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <textarea
              name="notes"
              rows={4}
              className="field resize-none"
              placeholder="Anything we should know: your garden, access, where you’d like the home to sit."
            />
          </Field>
          {/* Honeypot: hidden from people, tempting to bots */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Company
              <input name="company" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center">
          <button type="submit" disabled={status === "sending"} className="btn btn-primary disabled:opacity-60">
            {status === "sending" ? "Sending…" : intent === "reserve" ? "Reserve a build slot" : "Request your build"}
          </button>
          <p className="text-xs leading-relaxed text-muted">We reply {BRAND.responseTime}. No obligation.</p>
        </div>
        {status === "error" && (
          <p className="mt-6 text-sm text-[#8a3b2b]" role="alert">
            {message}
          </p>
        )}
      </form>

      <aside className="lg:col-span-5">
        <div className="border border-line p-6 md:p-8 lg:sticky lg:top-28">
          <p className="eyebrow text-muted">Your configuration</p>
          {config ? (
            <>
              <dl className="mt-6 space-y-3 text-sm">
                {summaryRows(config).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-4">
                    <dt className="text-muted">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
                <span className="text-sm text-muted">Indicative, inc. GST</span>
                <span className="heading text-3xl tabular-nums">{formatAUD(totalPrice(config))}</span>
              </div>
              <Link href={`/configure?${configToParams(config).toString()}`} className="link-arrow mt-6 text-ink-soft">
                Edit configuration
              </Link>
            </>
          ) : (
            <>
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                You haven’t configured a home yet. You can enquire without one, or design yours in 3D first and it will be attached here.
              </p>
              <Link href="/configure" className="link-arrow mt-6">
                Configure your home
              </Link>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow text-muted">{label}</span>
      {children}
      {error && <span className="mt-2 block text-xs text-[#8a3b2b]">{error}</span>}
    </label>
  );
}
