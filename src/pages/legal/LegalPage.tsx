import { useParams } from "react-router-dom";
import { FileWarning } from "lucide-react";
import { BUYER_FEE_RULE, NO_FEES_LINE, PAYOUT_RULE_MEETUP, PAYOUT_RULE_POST, SAFETY_EXPLAINER, SHIPPING_RULE } from "@/config/copy";
import { AUTO_CONFIRM_DAYS, CAR_SEAT_LIFESPAN_YEARS, REFUND_BUSINESS_DAYS } from "@/config/business";
import NotFound from "../NotFound";

interface Page {
  title: string;
  legal: boolean;
  intro?: string;
  sections: { h: string; p: string[] }[];
}

/**
 * Placeholder content. Every page marked `legal: true` needs review by a
 * lawyer before launch (TODO(legal)).
 */
const PAGES: Record<string, Page> = {
  "how-it-works": {
    title: "How Kindo works",
    legal: false,
    sections: [
      { h: "For sellers", p: [`${NO_FEES_LINE} List your item with photos, complete the safety checklist for higher-risk categories, and choose post, pickup or meetup.`, PAYOUT_RULE_POST, PAYOUT_RULE_MEETUP] },
      { h: "For buyers", p: [BUYER_FEE_RULE, SHIPPING_RULE] },
    ],
  },
  "buyer-protection": {
    title: "How Buyer Protection works",
    legal: true,
    intro: "Buyer Protection means your money is never sent straight to a stranger.",
    sections: [
      { h: "Your payment is held", p: [PAYOUT_RULE_POST, PAYOUT_RULE_MEETUP] },
      { h: "The fee", p: [BUYER_FEE_RULE] },
      { h: "If something's wrong", p: [`Raise an issue from your order before you confirm, and within ${AUTO_CONFIRM_DAYS} days of delivery. Your payment stays held until Kindo decides. If the item isn't as described, we'll refund you to your original payment method within ${REFUND_BUSINESS_DAYS} business days.`] },
      { h: "What isn't covered", p: ["TODO(legal): exclusions — e.g. payments made outside Kindo, change of mind, items confirmed as received."] },
    ],
  },
  "prohibited-items": {
    title: "Prohibited & recalled items",
    legal: true,
    intro: "Some baby products can't be sold on Kindo because they're unsafe, recalled or banned in Australia.",
    sections: [
      { h: "Never list", p: [
        "Any product subject to an active recall on productsafety.gov.au.",
        `Car seats past their expiry date (usually ${CAR_SEAT_LIFESPAN_YEARS} years after manufacture) or that have been in a car accident.`,
        "Inclined infant sleepers, baby walkers that don't meet the mandatory standard, and sleep positioners.",
        "Used mattresses that are damaged, stained or don't fit the cot snugly.",
        "Opened formula, breast milk, medicines or cosmetics.",
        "TODO(legal): complete list aligned with ACCC mandatory standards and bans.",
      ] },
      { h: "Recall checks", p: ["Kindo shows a recall status on listings. TODO(recalls): connect to the ACCC Product Safety Australia recalls data. Until then, always check productsafety.gov.au yourself."] },
    ],
  },
  "safety-guide": {
    title: "Safety guide for buying used baby gear",
    legal: false,
    intro: SAFETY_EXPLAINER,
    sections: [
      { h: "Prams & strollers", p: ["Check both brakes lock, the harness buckles hold, and the frame locks open. Look for the AS/NZS 2088 label."] },
      { h: "Car seats", p: [`Check the manufacture date on the label — most expire ${CAR_SEAT_LIFESPAN_YEARS} years after. Never buy a seat that's been in an accident. Look for the AS/NZS 1754 sticker and get it fitted by a professional.`] },
      { h: "Cots & bassinets", p: ["Bars should be 50–95 mm apart. Check every bolt, look for the AS/NZS 2172 label, and use a firm mattress that fits snugly."] },
      { h: "High chairs & carriers", p: ["Insist on a 5-point harness. For carriers, follow T.I.C.K.S.: tight, in view, close enough to kiss, keep chin off chest, supported back."] },
      { h: "At the handover", p: ["Meet somewhere public and well lit. Inspect the item fully before scanning the seller's QR code — that's what releases their payment."] },
    ],
  },
  terms: {
    title: "Terms of Service",
    legal: true,
    sections: [
      { h: "1. About Kindo", p: ["TODO(legal): parties, ABN, platform role (Kindo is a marketplace, not the seller)."] },
      { h: "2. Fees & payments", p: [BUYER_FEE_RULE, PAYOUT_RULE_POST, PAYOUT_RULE_MEETUP] },
      { h: "3. Listings", p: ["TODO(legal): seller obligations, prohibited items, accuracy of safety declarations."] },
      { h: "4. Disputes", p: ["TODO(legal): dispute process, Kindo's role in rulings, Australian Consumer Law."] },
      { h: "5. Kindo Pro", p: ["TODO(legal): subscription terms, renewals, cancellation."] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    legal: true,
    sections: [
      { h: "What we collect", p: ["TODO(legal): account details from Google sign-in, listings, messages, suburb-level location, optional child birth/due dates."] },
      { h: "Location", p: ["We only ever show your suburb and an approximate distance to other users — never your street address."] },
      { h: "Children's information", p: ["Child profiles are optional, visible only to you, and used only to personalise suggestions. TODO(legal): retention and deletion."] },
      { h: "Payments", p: ["Card and bank details are handled by our payments provider (Stripe) and never stored by Kindo."] },
      { h: "Your rights", p: ["TODO(legal): Australian Privacy Principles, access & correction, contact details."] },
    ],
  },
};

export default function LegalPage() {
  const { slug = "" } = useParams();
  const page = PAGES[slug];
  if (!page) return <NotFound />;
  return (
    <article className="page max-w-3xl">
      {page.legal && (
        <p className="mb-4 flex items-center gap-2 rounded-md bg-warn-soft px-3 py-2 text-caption font-medium text-warn" role="note">
          <FileWarning className="h-4 w-4" aria-hidden /> Placeholder — TODO: legal review before launch.
        </p>
      )}
      <h1 className="text-h1">{page.title}</h1>
      {page.intro && <p className="mt-3 text-body text-muted">{page.intro}</p>}
      {page.sections.map((s) => (
        <section key={s.h} className="mt-6">
          <h2 className="text-h2">{s.h}</h2>
          {s.p.map((p) => (
            <p key={p} className="mt-2 text-body">{p}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
