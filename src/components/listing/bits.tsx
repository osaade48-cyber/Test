import { useState } from "react";
import { Heart, MapPin, ShieldAlert, ShieldCheck, ClipboardCheck, BadgeCheck, Crown, Sparkles, Truck, Info, CircleHelp } from "lucide-react";
import type { Listing, RecallStatus, TrustTier, User } from "@/types/models";
import { cn } from "@/lib/cn";
import { formatDistance, formatMoney } from "@/lib/format";
import { tierLabel } from "@/lib/trust";
import { cardShippingTag } from "@/lib/pricing";
import { SAFETY_BADGE, SAFETY_EXPLAINER } from "@/config/copy";
import { FEATURES } from "@/config/business";
import { useToast, Modal } from "@/components/ui/overlay";
import { Badge } from "@/components/ui/primitives";
import { useAuthGuard } from "@/components/auth/SignIn";
import { isSavedSync, toggleSave } from "@/services/saved";
import { useTopicValue } from "@/hooks/useAsync";
import { Link } from "react-router-dom";

export function HeartButton({ listingId, className, variant = "overlay" }: { listingId: string; className?: string; variant?: "overlay" | "plain" }) {
  const saved = useTopicValue(["saved", "auth"], () => isSavedSync(listingId));
  const [anim, setAnim] = useState(false);
  const toast = useToast();
  const guard = useAuthGuard();
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        guard("Sign in to save items you love", async () => {
          setAnim(true);
          try {
            const now = await toggleSave(listingId);
            toast(now ? "Saved" : "Removed from saved");
          } catch (err) {
            toast((err as Error).message, "error");
          }
        });
      }}
      onAnimationEnd={() => setAnim(false)}
      className={cn(
        "inline-flex h-tap w-tap items-center justify-center rounded-full press",
        variant === "overlay" ? "bg-surface/90 shadow-card backdrop-blur hover:bg-surface" : "border border-line bg-surface hover:bg-surface-2",
        className,
      )}
    >
      <Heart className={cn("h-5 w-5 transition", saved ? "fill-brand text-brand" : "text-ink", anim && "animate-pop")} aria-hidden />
    </button>
  );
}

export function ShippingTag({ listing, className }: { listing: Listing; className?: string }) {
  const tag = cardShippingTag(listing);
  if (tag.kind === "free")
    return (
      <span className={cn("inline-flex items-center gap-1 text-caption font-semibold text-success", className)}>
        <Truck className="h-3.5 w-3.5" aria-hidden /> Free post
      </span>
    );
  if (tag.kind === "pickup")
    return (
      <span className={cn("inline-flex items-center gap-1 text-caption font-medium text-ink", className)}>
        <MapPin className="h-3.5 w-3.5 text-brand" aria-hidden /> {tag.label}
      </span>
    );
  return <span className={cn("text-caption text-muted", className)}>{tag.label}</span>;
}

/** Suburb-level location only — never a street address. `short` drops the state for tight cards. */
export function LocationLine({ listing, distanceKm, className, short }: { listing: Pick<Listing, "location">; distanceKm?: number | null; className?: string; short?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-caption text-muted", className)}>
      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">
        {listing.location.suburb}
        {!short && `, ${listing.location.state}`}
        {distanceKm != null && <> · {short ? `${Math.max(1, Math.round(distanceKm))} km` : formatDistance(distanceKm)}</>}
      </span>
    </span>
  );
}

export function PriceLine({ listing, className }: { listing: Pick<Listing, "price" | "originalPrice">; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold text-ink">{formatMoney(listing.price)}</span>
      {listing.originalPrice && listing.originalPrice > listing.price && (
        <span className="text-caption text-muted line-through">{formatMoney(listing.originalPrice)}</span>
      )}
    </span>
  );
}

/** Seller's own declaration — never "verified". */
export function SafetyBadge({ className, withExplainer = true }: { className?: string; withExplainer?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <Badge tone="success" icon={<ClipboardCheck className="h-3.5 w-3.5" aria-hidden />}>
        {SAFETY_BADGE}
      </Badge>
      {withExplainer && (
        <>
          <button type="button" className="inline-flex min-h-[32px] items-center gap-1 text-caption font-medium text-brand underline-offset-2 hover:underline" onClick={() => setOpen(true)}>
            <CircleHelp className="h-3.5 w-3.5" aria-hidden /> What does this mean?
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Safety checklist">
            <p className="text-body">{SAFETY_EXPLAINER}</p>
            <p className="mt-3 text-body">
              Read our <Link to="/safety-guide" className="link" onClick={() => setOpen(false)}>safety guide for buying used baby gear</Link>.
            </p>
          </Modal>
        </>
      )}
    </span>
  );
}

export function RecallBadge({ status, className }: { status: RecallStatus; className?: string }) {
  if (!FEATURES.recallCheck) return null;
  if (status === "recall_notice")
    return (
      <Badge tone="danger" className={className} icon={<ShieldAlert className="h-3.5 w-3.5" aria-hidden />}>
        Recall notice — do not buy
      </Badge>
    );
  if (status === "no_recalls")
    return (
      <Badge tone="neutral" className={className} icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />}>
        No recalls found
      </Badge>
    );
  return (
    <Badge tone="neutral" className={className} icon={<Info className="h-3.5 w-3.5" aria-hidden />}>
      Recall check pending
    </Badge>
  );
}

const TIER_ICON: Record<TrustTier, typeof BadgeCheck> = { new: Sparkles, trusted: ShieldCheck, verified: BadgeCheck, pro: Crown };
const TIER_TONE: Record<TrustTier, "neutral" | "info" | "lilac" | "success"> = { new: "neutral", trusted: "info", verified: "success", pro: "lilac" };

export function TrustBadge({ tier, className }: { tier: TrustTier; className?: string }) {
  if (!FEATURES.reviewsAndTrustTiers) return null;
  const Icon = TIER_ICON[tier];
  return (
    <Badge tone={TIER_TONE[tier]} className={className} icon={<Icon className="h-3.5 w-3.5" aria-hidden />}>
      {tierLabel(tier)}
    </Badge>
  );
}

export function sellerFirstName(u: Pick<User, "name">) {
  return u.name.split(" ")[0];
}
