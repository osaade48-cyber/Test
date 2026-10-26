import { Link } from "react-router-dom";
import { Layers, ShieldAlert } from "lucide-react";
import type { ListingWithMeta } from "@/services/listings";
import { conditionLabel, ageLabel } from "@/config/taxonomy";
import { cn } from "@/lib/cn";
import { ListingImage } from "./ListingImage";
import { HeartButton, LocationLine, PriceLine, ShippingTag } from "./bits";

/** Square photo, clear price, max 2 chips (condition + size/age), one delivery tag, heart. */
export function ListingCard({ listing, className, compact }: { listing: ListingWithMeta; className?: string; compact?: boolean }) {
  const sizeOrAge = listing.size ? `Size ${listing.size}` : ageLabel(listing.ageGroup);
  const unavailable = listing.status !== "active";
  return (
    <Link
      to={`/listing/${listing.id}`}
      className={cn("group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop focus-visible:-translate-y-0.5", className)}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        <ListingImage photo={listing.photos[0]} iconSize={compact ? 48 : 64} className="transition duration-300 group-hover:scale-[1.03]" />
        <HeartButton listingId={listing.id} className="absolute right-2 top-2" />
        {listing.isBundle && listing.bundleItemCount && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-surface/95 px-2 py-0.5 text-caption font-medium shadow-card">
            <Layers className="h-3.5 w-3.5" aria-hidden /> {listing.bundleItemCount} items
          </span>
        )}
        {listing.recallStatus === "recall_notice" && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-caption font-medium text-white">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> Recall notice
          </span>
        )}
        {unavailable && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1 text-center text-caption font-semibold text-on-ink">
            {listing.status === "reserved" ? "Reserved" : "Sold"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-micro font-semibold uppercase text-muted">{listing.brand}</p>
        <h3 className="line-clamp-2 font-sans text-body font-medium leading-snug text-ink">{listing.title}</h3>
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 pt-1">
          <PriceLine listing={listing} className="text-h3" />
          {!compact && <ShippingTag listing={listing} distanceKm={listing.distanceKm} className="whitespace-nowrap" />}
        </div>
        {!compact && (
          <>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-caption text-muted">{conditionLabel(listing.condition)}</span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-caption text-muted">{sizeOrAge}</span>
            </div>
            <LocationLine listing={listing} distanceKm={listing.distanceKm} short className="mt-0.5 min-w-0" />
          </>
        )}
      </div>
    </Link>
  );
}

export function ListingGrid({ listings }: { listings: ListingWithMeta[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

export function ListingRow({ listings, compact }: { listings: ListingWithMeta[]; compact?: boolean }) {
  return (
    <div className="scroll-row">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} compact={compact} className={cn("shrink-0 snap-start", compact ? "w-[150px]" : "w-[190px] md:w-[220px]")} />
      ))}
    </div>
  );
}
