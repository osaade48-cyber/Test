/**
 * Bundle cart — items grouped by seller, one postage charge per seller.
 * TODO(api): persist server-side so the cart follows the user across devices.
 */
import type { DeliveryMethod, SellerBundle } from "@/types/models";
import { availableMethods, haversineKm, priceOrder } from "@/lib/pricing";
import { db, latency, nowIso, persist, ServiceError } from "./mock/db";
import { currentUserId, requireUserId } from "./auth";
import { emit } from "./events";

export function cartCountSync(): number {
  return currentUserId() ? db.cart.items.length : 0;
}

export function inCartSync(listingId: string): boolean {
  return db.cart.items.some((i) => i.listingId === listingId);
}

/** Build seller bundles with honest pricing. Pure read of the mock DB. */
export function buildBundles(items = db.cart.items, deliveryBySeller = db.cart.deliveryBySeller): SellerBundle[] {
  const me = currentUserId();
  const buyer = me ? db.users.find((u) => u.id === me) : undefined;
  const groups = new Map<string, SellerBundle["listings"]>();
  for (const it of items) {
    const l = db.listings.find((x) => x.id === it.listingId && x.status === "active");
    if (!l) continue;
    const arr = groups.get(l.sellerId) ?? [];
    arr.push({ ...l, effectivePrice: it.offerPrice ?? l.price });
    groups.set(l.sellerId, arr);
  }
  return [...groups.entries()].map(([sellerId, listings]) => {
    const seller = db.users.find((u) => u.id === sellerId)!;
    const methods = availableMethods(listings);
    const chosen = deliveryBySeller[sellerId];
    const method: DeliveryMethod = chosen && methods.includes(chosen) ? chosen : methods[0] ?? "pickup";
    const distanceKm = buyer ? haversineKm(buyer.location, seller.location) : undefined;
    return {
      seller,
      listings,
      method,
      availableMethods: methods,
      pricing: priceOrder(listings, method, { distanceKm, sellerSuburb: seller.location.suburb }),
    };
  });
}

export async function getCart(): Promise<SellerBundle[]> {
  requireUserId();
  return latency(buildBundles());
}

export async function addToCart(listingId: string, offerPrice?: number): Promise<void> {
  const me = requireUserId();
  const l = db.listings.find((x) => x.id === listingId);
  if (!l || l.status !== "active") throw new ServiceError("This item is no longer available.", "unavailable");
  if (l.sellerId === me) throw new ServiceError("You can't buy your own listing.", "own_listing");
  const existing = db.cart.items.find((i) => i.listingId === listingId);
  if (existing) {
    if (offerPrice != null) existing.offerPrice = offerPrice;
  } else db.cart.items.push({ listingId, addedAt: nowIso(), offerPrice });
  persist();
  emit("cart");
  await latency(null);
}

export async function removeFromCart(listingId: string): Promise<void> {
  db.cart.items = db.cart.items.filter((i) => i.listingId !== listingId);
  persist();
  emit("cart");
  await latency(null);
}

export async function setDeliveryMethod(sellerId: string, method: DeliveryMethod): Promise<void> {
  db.cart.deliveryBySeller[sellerId] = method;
  persist();
  emit("cart");
}

export function removeSellerFromCartSync(sellerId: string) {
  db.cart.items = db.cart.items.filter((i) => db.listings.find((l) => l.id === i.listingId)?.sellerId !== sellerId);
  delete db.cart.deliveryBySeller[sellerId];
  persist();
  emit("cart");
}
