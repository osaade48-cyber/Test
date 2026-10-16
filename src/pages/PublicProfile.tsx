import { useParams } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getPublicProfile } from "@/services/users";
import { ErrorState, GridSkeleton, EmptyState } from "@/components/ui/states";
import { Avatar, Card, Skeleton, Stars } from "@/components/ui/primitives";
import { TrustBadge } from "@/components/listing/bits";
import { ListingGrid } from "@/components/listing/ListingCard";
import { formatDate, formatRelative } from "@/lib/format";
import { FEATURES } from "@/config/business";

export default function PublicProfile() {
  const { id = "" } = useParams();
  const state = useAsync(() => getPublicProfile(id), [id], ["listings", "orders"]);
  if (state.error) return <div className="page"><ErrorState error={state.error} onRetry={state.reload} /></div>;
  if (!state.data)
    return (
      <div className="page space-y-4">
        <Skeleton className="h-20 w-full" />
        <GridSkeleton count={4} />
      </div>
    );
  const { user: u, listings, reviews } = state.data;
  return (
    <div className="page">
      <div className="flex items-center gap-4">
        <Avatar name={u.name} color={u.avatarColor} size={72} />
        <div className="min-w-0">
          <h1 className="text-h1">{u.name.split(" ")[0]}</h1>
          <p className="flex flex-wrap items-center gap-2 text-caption text-muted">
            <TrustBadge tier={u.trustTier} />
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{u.location.suburb}, {u.location.state}</span>
            <span>· joined {formatDate(u.joinedAt)}</span>
          </p>
        </div>
      </div>
      {u.bio && <p className="mt-3 max-w-2xl text-body">{u.bio}</p>}
      {FEATURES.reviewsAndTrustTiers && (
        <Card className="mt-4 max-w-2xl">
          <dl className="grid grid-cols-3 text-center">
            <div><dd className="text-h2 font-sans">{u.rating?.toFixed(1) ?? "—"}</dd><dt className="text-caption text-muted">{u.reviewCount} reviews</dt></div>
            <div><dd className="text-h2 font-sans">{u.completedSales}</dd><dt className="text-caption text-muted">Completed sales</dt></div>
            <div><dd className="inline-flex items-center gap-1 text-h2 font-sans"><Clock className="h-4 w-4" aria-hidden />{u.responseTimeHours != null ? `${u.responseTimeHours}h` : "—"}</dd><dt className="text-caption text-muted">Response time</dt></div>
          </dl>
        </Card>
      )}
      <h2 className="mb-3 mt-8 text-h2">Listings</h2>
      {listings.length ? <ListingGrid listings={listings} /> : <EmptyState illustration="tag" title="No active listings" />}
      {FEATURES.reviewsAndTrustTiers && (
        <>
          <h2 className="mb-3 mt-8 text-h2">Reviews</h2>
          {reviews.length ? (
            <ul className="max-w-2xl space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="card p-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.author.name} color={r.author.avatarColor} size={28} />
                    <span className="font-medium">{r.author.name.split(" ")[0]}</span>
                    <span className="text-caption text-muted">· {r.role === "buyer" ? "bought from" : "sold to"} {u.name.split(" ")[0]} · {formatRelative(r.createdAt)}</span>
                  </div>
                  <Stars rating={r.rating} className="mt-2" />
                  {r.comment && <p className="mt-1 text-body">{r.comment}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-muted">No reviews yet.</p>
          )}
        </>
      )}
    </div>
  );
}
