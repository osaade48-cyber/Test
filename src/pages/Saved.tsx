import { Link } from "react-router-dom";
import { BellRing, TrendingDown } from "lucide-react";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { getSaved, setPriceDropAlert } from "@/services/saved";
import { AsyncView, EmptyState, GridSkeleton } from "@/components/ui/states";
import { ListingCard } from "@/components/listing/ListingCard";
import { ButtonLink } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/primitives";
import { FEATURES } from "@/config/business";
import { formatMoney } from "@/lib/format";

export default function Saved() {
  return (
    <RequireAuth title="Sign in to see your saved items">
      <SavedInner />
    </RequireAuth>
  );
}

function SavedInner() {
  const state = useAsync(getSaved, [], ["saved", "listings"]);
  return (
    <div className="page">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-h1">Saved</h1>
          <p className="text-caption text-muted">{state.data ? `${state.data.length} items` : " "}</p>
        </div>
        {FEATURES.savedSearches && (
          <Link to="/profile/alerts" className="link inline-flex min-h-tap items-center gap-1.5">
            <BellRing className="h-4 w-4" aria-hidden /> Search alerts
          </Link>
        )}
      </div>
      <div className="mt-4">
        <AsyncView
          state={state}
          skeleton={<GridSkeleton count={4} />}
          empty={
            <EmptyState
              illustration="heart"
              title="Nothing saved yet"
              body="Tap the heart on items you love and they'll wait for you here."
              action={<ButtonLink to="/browse">Start browsing</ButtonLink>}
            />
          }
        >
          {(items) => (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {items.map((s) => (
                <div key={s.listingId} className="flex flex-col gap-2">
                  {s.priceDrop && (
                    <p className="inline-flex items-center gap-1 self-start rounded-full bg-success-soft px-2.5 py-0.5 text-caption font-semibold text-success">
                      <TrendingDown className="h-3.5 w-3.5" aria-hidden /> {formatMoney(s.priceDrop)} price drop
                    </p>
                  )}
                  <ListingCard listing={s.listing} />
                  {FEATURES.priceDropAlerts && s.listing.status === "active" && (
                    <div className="px-1">
                      <Toggle checked={s.priceDropAlert} onChange={(v) => setPriceDropAlert(s.listingId, v)} label="Price-drop alert" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </AsyncView>
      </div>
    </div>
  );
}
