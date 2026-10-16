/** Saved items (hearts), price-drop alerts and saved searches. */
import type { ListingQuery, SavedItem, SavedSearch } from "@/types/models";
import { uid } from "@/lib/id";
import { db, latency, nowIso, persist } from "./mock/db";
import { currentUserId, requireUserId } from "./auth";
import { emit } from "./events";
import { searchListings, type ListingWithMeta } from "./listings";

export interface SavedEntry extends SavedItem {
  listing: ListingWithMeta;
  priceDrop: number | null;
}

export function isSavedSync(listingId: string): boolean {
  const me = currentUserId();
  return !!me && db.savedItems.some((s) => s.userId === me && s.listingId === listingId);
}

export function savedCountSync(): number {
  const me = currentUserId();
  return me ? db.savedItems.filter((s) => s.userId === me).length : 0;
}

export async function getSaved(): Promise<SavedEntry[]> {
  const me = requireUserId();
  const all = await searchListings({ status: "all" });
  const entries = db.savedItems
    .filter((s) => s.userId === me)
    .map((s) => {
      const listing = all.find((l) => l.id === s.listingId);
      return listing ? { ...s, listing, priceDrop: listing.price < s.priceAtSave ? s.priceAtSave - listing.price : null } : null;
    })
    .filter((x): x is SavedEntry => !!x && x.listing.status !== "removed")
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return latency(entries);
}

/** Returns the new saved state. */
export async function toggleSave(listingId: string): Promise<boolean> {
  const me = requireUserId();
  const listing = db.listings.find((l) => l.id === listingId);
  const idx = db.savedItems.findIndex((s) => s.userId === me && s.listingId === listingId);
  let saved: boolean;
  if (idx >= 0) {
    db.savedItems.splice(idx, 1);
    if (listing) listing.saves = Math.max(0, listing.saves - 1);
    saved = false;
  } else {
    db.savedItems.push({ listingId, userId: me, priceAtSave: listing?.price ?? 0, priceDropAlert: true, savedAt: nowIso() });
    if (listing) listing.saves += 1;
    saved = true;
  }
  persist();
  emit("saved");
  return latency(saved);
}

export async function setPriceDropAlert(listingId: string, on: boolean): Promise<void> {
  const me = requireUserId();
  const s = db.savedItems.find((x) => x.userId === me && x.listingId === listingId);
  if (s) s.priceDropAlert = on;
  persist();
  emit("saved");
  await latency(null);
}

// ─── Saved searches ────────────────────────────────────────────────────────

export async function getSavedSearches(): Promise<SavedSearch[]> {
  const me = requireUserId();
  return latency(db.savedSearches.filter((s) => s.userId === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function createSavedSearch(label: string, query: ListingQuery, notify = true): Promise<SavedSearch> {
  const me = requireUserId();
  const matches = await searchListings(query);
  const s: SavedSearch = { id: uid("ss"), userId: me, label, query, notify, createdAt: nowIso(), lastMatchCount: matches.length };
  db.savedSearches.push(s);
  persist();
  emit("alerts");
  return latency(s);
}

export async function updateSavedSearch(id: string, patch: Partial<Pick<SavedSearch, "notify" | "label">>): Promise<void> {
  const s = db.savedSearches.find((x) => x.id === id);
  if (s) Object.assign(s, patch);
  persist();
  emit("alerts");
  await latency(null);
}

export async function deleteSavedSearch(id: string): Promise<void> {
  db.savedSearches = db.savedSearches.filter((x) => x.id !== id);
  persist();
  emit("alerts");
  await latency(null);
}
