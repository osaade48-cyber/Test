import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, ChevronDown, ClipboardCheck, Lock, MessageCircle, QrCode, Search, ShieldCheck, Wallet } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { CategoryTile } from "@/components/icons/CategoryIcon";
import { ListingRow } from "@/components/listing/ListingCard";
import { CardSkeleton } from "@/components/ui/states";
import { CATEGORIES } from "@/config/taxonomy";
import { STATS_THRESHOLDS } from "@/config/business";
import { BUYER_FEE_RULE, NO_FEES_LINE, PAYOUT_RULE_MEETUP, PAYOUT_RULE_POST, SHIPPING_RULE, SIGN_IN_LINE } from "@/config/copy";
import { useAsync } from "@/hooks/useAsync";
import { searchListings } from "@/services/listings";
import { getPlatformStats } from "@/services/users";
import { cn } from "@/lib/cn";

const STEPS = [
  { icon: Camera, title: "List it free", body: "Snap a few photos, complete the safety checklist and set your price. No listing fees." },
  { icon: MessageCircle, title: "Chat & agree", body: "Buyers message you, make offers and choose post, pickup or meetup." },
  { icon: Lock, title: "Pay securely", body: "The buyer pays in the app. Kindo holds the money until the item is handed over." },
  { icon: Wallet, title: "Get paid", body: "Money is released once the buyer confirms — or scans your QR code at pickup." },
];

const WHY = [
  { icon: Lock, title: "Safe payments", body: "No cash, no bank transfers to strangers. Your payment is held until you've got the item." },
  { icon: QrCode, title: "QR handover", body: "For prams and cots: inspect it first, then scan the seller's code to release payment." },
  { icon: ClipboardCheck, title: "Safety checklists", body: "Sellers of prams, car seats, cots and carriers answer a category-specific checklist." },
  { icon: Search, title: "Baby-specific search", body: "Filter by age, size, condition and distance — not just keywords." },
];

const FAQ = [
  { q: "How much does it cost?", a: `${NO_FEES_LINE} ${BUYER_FEE_RULE}` },
  { q: "When does the seller get paid?", a: `${PAYOUT_RULE_POST} ${PAYOUT_RULE_MEETUP}` },
  { q: "How does shipping work?", a: SHIPPING_RULE },
  { q: "What if something's wrong with my item?", a: "Raise an issue from your order before you confirm. Your payment stays held while Kindo reviews it, and we'll refund you if the item isn't as described." },
  { q: "Has Kindo checked the items?", a: "No. Sellers complete a safety checklist for higher-risk categories, but it's their own declaration. Always inspect items yourself — our safety guide shows what to look for." },
];

export default function Landing() {
  const recent = useAsync(() => searchListings({ limit: 10 }), []);
  const stats = useAsync(getPlatformStats, []);
  const s = stats.data;
  const visibleStats = s
    ? [
        s.activeListings >= STATS_THRESHOLDS.listings && `${s.activeListings.toLocaleString()} listings`,
        s.sellers >= STATS_THRESHOLDS.sellers && `${s.sellers.toLocaleString()} sellers`,
        s.averageRating != null && s.averageRating >= STATS_THRESHOLDS.rating.min && s.reviewCount >= STATS_THRESHOLDS.rating.minReviews && `${s.averageRating.toFixed(1)}★ average rating`,
      ].filter(Boolean)
    : [];

  return (
    <div>
      {/* Hero */}
      <section className="px-gutter pb-10 pt-8 md:pt-14">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-caption font-medium text-brand">
              <ShieldCheck className="h-4 w-4" aria-hidden /> Payment held until you've got the item
            </p>
            <h1 className="text-display">Pre-loved baby &amp; kids gear, passed on safely.</h1>
            <p className="mt-4 max-w-lg text-body text-muted md:text-[1.0625rem]">
              Buy and sell prams, cots, car seats, toys and clothes with Australian parents. {NO_FEES_LINE}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/sell" variant="brand" size="lg">
                Start selling free
              </ButtonLink>
              <ButtonLink to="/browse" variant="secondary" size="lg" icon={<Search className="h-5 w-5" />}>
                Browse
              </ButtonLink>
            </div>
            <p className="mt-4 text-caption text-muted">Join Australian parents giving baby gear a second life.</p>
            {visibleStats.length > 0 && <p className="mt-2 text-caption font-medium text-ink">{visibleStats.join(" · ")}</p>}
          </div>
          {/* TODO(content): replace with a real lifestyle photo (parent + pram, natural light). */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-2 md:aspect-square" role="img" aria-label="Lifestyle photo placeholder">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgb(var(--c-brand-soft)),transparent_60%),radial-gradient(circle_at_75%_70%,rgb(var(--c-sky-soft)),transparent_55%)]" />
            <div className="absolute inset-0 grid grid-cols-3 gap-3 p-6 opacity-90">
              {(["prams", "clothing", "toys", "nursery", "car-seats", "books"] as const).map((c, i) => (
                <div key={c} className={cn("flex items-center justify-center rounded-lg bg-surface/70 backdrop-blur", i % 2 ? "translate-y-4" : "")}>
                  <CategoryTile id={c} className="h-14 w-14" size={28} />
                </div>
              ))}
            </div>
            <span className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-micro font-semibold uppercase text-muted">Photo placeholder</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface px-gutter py-12" aria-labelledby="how">
        <div className="mx-auto max-w-6xl">
          <h2 id="how" className="text-h1">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-lg border border-line p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-lilac-soft text-lilac">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-caption font-semibold text-muted">Step {i + 1}</p>
                <h3 className="text-h3">{s.title}</h3>
                <p className="mt-1 text-body text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl rounded-md bg-surface-2 p-4 text-body">
            <strong>When does the seller get paid?</strong> {PAYOUT_RULE_POST} {PAYOUT_RULE_MEETUP}
          </p>
        </div>
      </section>

      {/* Why Kindo */}
      <section className="px-gutter py-12" aria-labelledby="why">
        <div className="mx-auto max-w-6xl">
          <h2 id="why" className="text-h1">Why Kindo, not a Facebook group?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="card p-5">
                <w.icon className="h-6 w-6 text-brand" aria-hidden />
                <h3 className="mt-3 text-h3">{w.title}</h3>
                <p className="mt-1 text-body text-muted">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-gutter pb-12" aria-labelledby="cats">
        <div className="mx-auto max-w-6xl">
          <h2 id="cats" className="text-h1">Shop by category</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <Link key={c.id} to={`/browse?category=${c.id}`} className="card flex min-h-[72px] items-center gap-3 p-3 transition hover:shadow-pop">
                <CategoryTile id={c.id} className="h-11 w-11" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.label}</span>
                  <span className="block truncate text-caption text-muted">{c.hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent listings */}
      <section className="px-gutter pb-12" aria-labelledby="recent">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between">
            <h2 id="recent" className="text-h1">Just listed</h2>
            <Link to="/browse" className="link inline-flex min-h-tap items-center gap-1">
              See all <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          {recent.data ? (
            <ListingRow listings={recent.data} />
          ) : (
            <div className="scroll-row">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="w-[190px] shrink-0 md:w-[220px]">
                  <CardSkeleton />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface px-gutter py-12" aria-labelledby="faq">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq" className="text-h1">Questions parents ask</h2>
          <div className="mt-5 divide-y divide-line rounded-lg border border-line">
            {FAQ.map((f) => (
              <FaqItem key={f.q} {...f} />
            ))}
          </div>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <ButtonLink to="/sell" variant="brand" size="lg">
              Start selling free
            </ButtonLink>
            <span className="text-caption text-muted">
              <Lock className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              {SIGN_IN_LINE}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-[56px] w-full items-center justify-between gap-4 px-4 text-left font-medium">
        {q}
        <ChevronDown className={cn("h-5 w-5 shrink-0 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && <p className="px-4 pb-4 text-body text-muted">{a}</p>}
    </div>
  );
}
