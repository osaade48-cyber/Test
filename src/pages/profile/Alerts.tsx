import { Link } from "react-router-dom";
import { Search, Trash2 } from "lucide-react";
import type { ListingQuery } from "@/types/models";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { deleteSavedSearch, getSaved, getSavedSearches, setPriceDropAlert, updateSavedSearch } from "@/services/saved";
import { AsyncView, EmptyState, RowSkeleton } from "@/components/ui/states";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/overlay";
import { formatDate, formatMoney } from "@/lib/format";
import { FEATURES } from "@/config/business";

function toParams(q: ListingQuery): string {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  if (q.category) sp.set("category", q.category);
  if (q.maxPrice != null) sp.set("max", String(q.maxPrice));
  if (q.minPrice != null) sp.set("min", String(q.minPrice));
  if (q.radiusKm != null) sp.set("radius", String(q.radiusKm));
  if (q.ageGroups?.length) sp.set("age", q.ageGroups.join(","));
  if (q.conditions?.length) sp.set("cond", q.conditions.join(","));
  return sp.toString();
}

export default function Alerts() {
  return (
    <RequireAuth title="Sign in to manage alerts">
      <AlertsInner />
    </RequireAuth>
  );
}

function AlertsInner() {
  const searches = useAsync(getSavedSearches, [], ["alerts"]);
  const saved = useAsync(getSaved, [], ["saved"]);
  const toast = useToast();
  return (
    <div className="page max-w-2xl">
      <h1 className="text-h1">Alerts</h1>
      <p className="text-body text-muted">Get notified when something you want is listed, or when a saved item drops in price.</p>

      <h2 className="mb-2 mt-6 text-h2">Saved searches</h2>
      <AsyncView
        state={searches}
        skeleton={<RowSkeleton count={2} />}
        empty={
          <EmptyState
            illustration="bell"
            title="No saved searches"
            body="Search for something like “Bugaboo Fox under $600 within 20 km”, then tap Save search."
            action={<ButtonLink to="/browse" icon={<Search className="h-4 w-4" />}>Start a search</ButtonLink>}
          />
        }
      >
        {(list) => (
          <ul className="card divide-y divide-line">
            {list.map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-3">
                <Link to={`/browse?${toParams(s.query)}`} className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.label}</span>
                  <span className="block text-caption text-muted">
                    Saved {formatDate(s.createdAt)}{s.lastMatchCount != null && ` · ${s.lastMatchCount} current matches`}
                  </span>
                </Link>
                <Toggle checked={s.notify} onChange={(v) => updateSavedSearch(s.id, { notify: v })} label="Notify" />
                <IconButton label={`Delete ${s.label}`} onClick={async () => { await deleteSavedSearch(s.id); toast("Alert deleted"); }}>
                  <Trash2 className="h-5 w-5" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </AsyncView>

      {FEATURES.priceDropAlerts && (
        <>
          <h2 className="mb-2 mt-8 text-h2">Price-drop alerts</h2>
          <AsyncView
            state={saved}
            skeleton={<RowSkeleton count={2} />}
            empty={<EmptyState illustration="heart" title="No saved items" body="Save items with the heart to get price-drop alerts." />}
          >
            {(items) => (
              <ul className="card divide-y divide-line">
                {items.map((s) => (
                  <li key={s.listingId} className="flex items-center gap-3 p-3">
                    <Link to={`/listing/${s.listingId}`} className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.listing.title}</span>
                      <span className="block text-caption text-muted">
                        Now {formatMoney(s.listing.price)}
                        {s.priceDrop ? <span className="text-success"> · dropped {formatMoney(s.priceDrop)}</span> : ` · saved at ${formatMoney(s.priceAtSave)}`}
                      </span>
                    </Link>
                    <Toggle checked={s.priceDropAlert} onChange={(v) => setPriceDropAlert(s.listingId, v)} label="Alert" />
                  </li>
                ))}
              </ul>
            )}
          </AsyncView>
        </>
      )}
    </div>
  );
}
