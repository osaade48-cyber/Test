/**
 * Listings service. TODO(api): each function maps to a REST endpoint, e.g.
 *   searchListings → GET /listings?…   getListing → GET /listings/:id
 */
import type { CategoryId, Listing, ListingDraft, ListingQuery, ListingStatus, User } from "@/types/models";
import { haversineKm, isLargeItem, isTooFarForPickup } from "@/lib/pricing";
import { validateForPublish } from "@/lib/listingValidation";
import { FREE_SHIPPING_THRESHOLD, BOOST_DURATION_DAYS } from "@/config/business";
import { uid } from "@/lib/id";
import { db, latency, nowIso, persist, ServiceError } from "./mock/db";
import { currentUserId, requireUserId } from "./auth";
import { emit } from "./events";

export interface ListingWithMeta extends Listing {
  seller: User;
  distanceKm: number | null;
}

function viewerLocation() {
  const id = currentUserId();
  return id ? db.users.find((u) => u.id === id)?.location ?? null : null;
}

function withMeta(l: Listing): ListingWithMeta {
  const loc = viewerLocation();
  return {
    ...l,
    seller: db.users.find((u) => u.id === l.sellerId)!,
    distanceKm: loc ? haversineKm(loc, l.location) : null,
  };
}

function matches(l: ListingWithMeta, q: ListingQuery): boolean {
  if (q.status !== "all" && l.status !== (q.status ?? "active")) return false;
  if (q.sellerId && l.sellerId !== q.sellerId) return false;
  if (q.category && l.category !== q.category) return false;
  if (q.ageGroups?.length && !q.ageGroups.includes(l.ageGroup) && l.ageGroup !== "all") return false;
  if (q.conditions?.length && !q.conditions.includes(l.condition)) return false;
  if (q.gender && l.gender && l.gender !== q.gender && l.gender !== "unisex") return false;
  if (q.minPrice != null && l.price < q.minPrice) return false;
  if (q.maxPrice != null && l.price > q.maxPrice) return false;
  if (q.radiusKm != null && l.distanceKm != null && l.distanceKm > q.radiusKm) return false;
  if (q.delivery === "post" && !(l.delivery.post || l.delivery.largeCalculated)) return false;
  if (q.delivery === "pickup" && (!(l.delivery.pickup || l.delivery.meetup) || isTooFarForPickup(l.distanceKm))) return false;
  if (q.freeShipping && !(l.delivery.post && !isLargeItem(l) && l.price >= FREE_SHIPPING_THRESHOLD)) return false;
  if (q.q) {
    const hay = `${l.title} ${l.brand} ${l.model ?? ""} ${l.description} ${l.size ? `size ${l.size}` : ""}`.toLowerCase();
    const terms = q.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.every((t) => hay.includes(t))) return false;
  }
  return true;
}

function sortListings(list: ListingWithMeta[], sort: ListingQuery["sort"]) {
  const boosted = (l: Listing) => (l.boostedUntil && new Date(l.boostedUntil) > new Date() ? 1 : 0);
  return [...list].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "nearest") return (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9);
    // newest: boosted listings first, then by date
    return boosted(b) - boosted(a) || b.createdAt.localeCompare(a.createdAt);
  });
}

export async function searchListings(q: ListingQuery = {}): Promise<ListingWithMeta[]> {
  const result = sortListings(db.listings.map(withMeta).filter((l) => matches(l, q)), q.sort);
  return latency(q.limit ? result.slice(0, q.limit) : result);
}

export async function getListing(id: string): Promise<ListingWithMeta> {
  const l = db.listings.find((x) => x.id === id && x.status !== "removed");
  if (!l) throw new ServiceError("This listing doesn't exist or has been removed.", "not_found");
  return latency(withMeta(l));
}

export async function recordView(id: string): Promise<void> {
  const l = db.listings.find((x) => x.id === id);
  if (!l) return;
  if (l.sellerId !== currentUserId()) l.views += 1;
  db.recentlyViewed = [id, ...db.recentlyViewed.filter((x) => x !== id)].slice(0, 12);
  persist();
}

export async function getRecentlyViewed(): Promise<ListingWithMeta[]> {
  const list = db.recentlyViewed
    .map((id) => db.listings.find((l) => l.id === id))
    .filter((l): l is Listing => !!l && l.status !== "removed")
    .map(withMeta);
  return latency(list);
}

export async function clearRecentlyViewed(): Promise<void> {
  db.recentlyViewed = [];
  persist();
  await latency(null);
}

export type FeedTab = "for_you" | "trending" | "following";

/** Home feed rows. "Following" = sellers you've bought from. */
export async function getFeed(tab: FeedTab, limit = 10): Promise<ListingWithMeta[]> {
  const me = currentUserId();
  let list = db.listings.filter((l) => l.status === "active" && l.sellerId !== me).map(withMeta);
  if (tab === "trending") list.sort((a, b) => b.saves * 3 + b.views - (a.saves * 3 + a.views));
  else if (tab === "following") {
    const followed = new Set(db.orders.filter((o) => o.buyerId === me).map((o) => o.sellerId));
    list = list.filter((l) => followed.has(l.sellerId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else list = sortListings(list, "nearest").slice(0, limit * 2).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return latency(list.slice(0, limit));
}

export async function getByCategories(categories: CategoryId[], ageGroups: string[], limit = 10): Promise<ListingWithMeta[]> {
  const me = currentUserId();
  const list = db.listings
    .filter((l) => l.status === "active" && l.sellerId !== me && categories.includes(l.category))
    .filter((l) => l.ageGroup === "all" || ageGroups.includes(l.ageGroup))
    .map(withMeta);
  return latency(sortListings(list, "newest").slice(0, limit));
}

// ─── Seller side ────────────────────────────────────────────────────────────

export interface MyListingsSummary {
  listings: Listing[];
  stats: { listed: number; views: number; saves: number; boosted: number };
}

export async function getMyListings(status: ListingStatus | "sold_reserved" = "active"): Promise<MyListingsSummary> {
  const me = requireUserId();
  const mine = db.listings.filter((l) => l.sellerId === me && l.status !== "removed");
  const active = mine.filter((l) => l.status === "active");
  const filtered = mine
    .filter((l) => (status === "sold_reserved" ? l.status === "sold" || l.status === "reserved" : l.status === status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return latency({
    listings: filtered,
    stats: {
      listed: active.length,
      views: active.reduce((s, l) => s + l.views, 0),
      saves: active.reduce((s, l) => s + l.saves, 0),
      boosted: active.filter((l) => l.boostedUntil && new Date(l.boostedUntil) > new Date()).length,
    },
  });
}

export async function setListingStatus(ids: string[], status: ListingStatus): Promise<void> {
  const me = requireUserId();
  for (const id of ids) {
    const l = db.listings.find((x) => x.id === id && x.sellerId === me);
    if (l) {
      l.status = status;
      l.updatedAt = nowIso();
    }
  }
  persist();
  emit("listings");
  await latency(null);
}

export async function updatePrice(id: string, price: number): Promise<Listing> {
  const me = requireUserId();
  const l = db.listings.find((x) => x.id === id && x.sellerId === me);
  if (!l) throw new ServiceError("Listing not found", "not_found");
  if (price < l.price) l.originalPrice = l.originalPrice ?? l.price;
  l.price = price;
  l.updatedAt = nowIso();
  // Price-drop alerts for anyone who saved it.
  for (const s of db.savedItems.filter((s) => s.listingId === id && s.priceDropAlert && price < s.priceAtSave)) {
    db.notifications.unshift({
      id: uid("n"), userId: s.userId, kind: "price_drop", title: "Price drop on a saved item",
      body: `${l.title} is now $${price}`, href: `/listing/${id}`, read: false, createdAt: nowIso(),
    });
  }
  persist();
  emit("listings", "notifications");
  return latency(l);
}

/** TODO(stripe): boosts are paid (or use a Pro credit) — wire to payments.buyBoost. */
export async function boostListing(id: string): Promise<Listing> {
  const me = requireUserId();
  const l = db.listings.find((x) => x.id === id && x.sellerId === me);
  if (!l) throw new ServiceError("Listing not found", "not_found");
  if (db.subscription.boostsRemaining > 0) db.subscription.boostsRemaining -= 1;
  l.boostedUntil = new Date(Date.now() + BOOST_DURATION_DAYS * 864e5).toISOString();
  persist();
  emit("listings", "subscription");
  return latency(l);
}

// ─── Drafts & publishing ───────────────────────────────────────────────────

export async function getDraft(key = "new"): Promise<ListingDraft | null> {
  return latency((db.drafts[key] as ListingDraft) ?? null);
}

/** Autosave — called on every change, debounced by the UI. */
export async function saveDraft(draft: ListingDraft, key = "new"): Promise<void> {
  db.drafts[key] = draft;
  persist();
}

export async function discardDraft(key = "new"): Promise<void> {
  delete db.drafts[key];
  persist();
}

export async function publishListing(draft: ListingDraft, key = "new"): Promise<Listing> {
  const me = requireUserId();
  const issues = validateForPublish(draft);
  if (issues.length) throw new ServiceError(issues[0].message, "validation");
  const seller = db.users.find((u) => u.id === me)!;
  const now = nowIso();
  const existing = draft.id ? db.listings.find((l) => l.id === draft.id && l.sellerId === me) : undefined;
  const listing: Listing = {
    id: existing?.id ?? uid("l"),
    sellerId: me,
    title: draft.title!.trim(),
    brand: draft.brand?.trim() || "Unbranded",
    model: draft.model,
    description: draft.description?.trim() ?? "",
    category: draft.category!,
    condition: draft.condition!,
    ageGroup: draft.ageGroup!,
    size: draft.size,
    gender: draft.gender,
    price: draft.price!,
    originalPrice: existing && draft.price! < existing.price ? existing.price : existing?.originalPrice,
    photos: draft.photos!,
    isLargeItem: isLargeItem({ category: draft.category!, isLargeItem: !!draft.isLargeItem }),
    isBundle: draft.isBundle,
    bundleItemCount: draft.isBundle ? draft.bundleItemCount : undefined,
    delivery: draft.delivery!,
    location: seller.location,
    safety: draft.safety,
    recallStatus: existing?.recallStatus ?? "not_checked",
    status: "active",
    views: existing?.views ?? 0,
    saves: existing?.saves ?? 0,
    boostedUntil: existing?.boostedUntil,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  if (existing) Object.assign(existing, listing);
  else db.listings.unshift(listing);
  delete db.drafts[key];
  persist();
  emit("listings");
  return latency(listing);
}

/** "Sell one like this": a draft prefilled from a listing you bought. */
export async function draftFromListing(listingId: string): Promise<ListingDraft> {
  const l = db.listings.find((x) => x.id === listingId);
  if (!l) throw new ServiceError("Listing not found", "not_found");
  return latency({
    brand: l.brand,
    model: l.model,
    category: l.category,
    ageGroup: l.ageGroup,
    size: l.size,
    gender: l.gender,
    title: l.title,
    isLargeItem: l.isLargeItem,
    delivery: l.delivery,
    photos: [],
    step: 1,
  });
}

export async function editDraftFor(listingId: string): Promise<ListingDraft> {
  const me = requireUserId();
  const l = db.listings.find((x) => x.id === listingId && x.sellerId === me);
  if (!l) throw new ServiceError("Listing not found", "not_found");
  const { sellerId: _s, status: _st, views: _v, saves: _sv, createdAt: _c, updatedAt: _u, ...rest } = l;
  return latency({ ...rest, step: 2 });
}
