/**
 * Pricing rules. Pure functions — no I/O — so the same logic can be ported to
 * (or replaced by) the server. All numbers come from config/business.ts.
 */
import {
  BUYER_FEE_CAP,
  BUYER_FEE_FIXED,
  BUYER_FEE_PERCENT,
  FREE_SHIPPING_THRESHOLD,
  LARGE_ITEM_CATEGORIES,
  LARGE_ITEM_COURIER_BASE,
  LARGE_ITEM_COURIER_PER_KM,
  MAX_PICKUP_DISTANCE_KM,
  SATCHELS,
} from "@/config/business";
import type { DeliveryMethod, Listing, Location, OrderPricing, SatchelSize } from "@/types/models";
import { formatMoney } from "./format";

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Buyer protection fee for one order (one seller). Sellers pay nothing. */
export function buyerFee(itemSubtotal: number): number {
  if (itemSubtotal <= 0) return 0;
  return round2(Math.min(BUYER_FEE_CAP, (itemSubtotal * BUYER_FEE_PERCENT) / 100 + BUYER_FEE_FIXED));
}

export function isLargeItem(l: Pick<Listing, "category" | "isLargeItem">): boolean {
  return l.isLargeItem || LARGE_ITEM_CATEGORIES.includes(l.category);
}

const SATCHEL_ORDER: SatchelSize[] = ["S", "M", "L", "XL"];

/** The one satchel a seller uses for several small items: the largest of them. */
export function bundleSatchel(listings: Pick<Listing, "delivery">[]): SatchelSize | null {
  let idx = -1;
  for (const l of listings) {
    if (!l.delivery.post) continue;
    idx = Math.max(idx, SATCHEL_ORDER.indexOf(l.delivery.post.satchel));
  }
  return idx < 0 ? null : SATCHEL_ORDER[idx];
}

/** Shipping label shown on listings — always includes the price. */
export function satchelLabel(size: SatchelSize): string {
  return `${SATCHELS[size].label} · ${formatMoney(SATCHELS[size].price)}`;
}

/** Delivery methods every listing in a seller group supports. */
export function availableMethods(listings: Listing[]): DeliveryMethod[] {
  if (listings.length === 0) return [];
  const methods: DeliveryMethod[] = [];
  const anyLarge = listings.some(isLargeItem);
  if (!anyLarge && listings.every((l) => l.delivery.post)) methods.push("post");
  if (listings.every((l) => l.delivery.pickup)) methods.push("pickup");
  if (listings.every((l) => l.delivery.meetup)) methods.push("meetup");
  // Large items default to pickup/meetup; calculated courier shipping comes last.
  if (anyLarge && listings.every((l) => (isLargeItem(l) ? l.delivery.largeCalculated : l.delivery.post))) {
    methods.push("large_calculated");
  }
  return methods;
}

export function haversineKm(a: Pick<Location, "lat" | "lng">, b: Pick<Location, "lat" | "lng">): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** TODO(shipping): mock courier quote for one large item. */
export function courierQuote(distanceKm: number): number {
  return round2(LARGE_ITEM_COURIER_BASE + LARGE_ITEM_COURIER_PER_KM * distanceKm);
}

export const METHOD_LABEL: Record<DeliveryMethod, string> = {
  post: "Post",
  large_calculated: "Courier (large item)",
  pickup: "Pickup",
  meetup: "Meetup",
};

export interface PriceOptions {
  /** Distance buyer↔seller. Needed to quote large-item courier shipping. */
  distanceKm?: number;
  /** Seller suburb for pickup labels. */
  sellerSuburb?: string;
}

/**
 * Honest pricing for one seller group: items + postage + buyer fee.
 * If postage can't be known yet (large-item courier without a distance),
 * `postage` is null and `postageLabel` says so — UI shows "+ shipping".
 */
export function priceOrder(
  listings: (Pick<Listing, "category" | "isLargeItem" | "delivery"> & { effectivePrice: number })[],
  method: DeliveryMethod,
  opts: PriceOptions = {},
): OrderPricing {
  const itemSubtotal = round2(listings.reduce((s, l) => s + l.effectivePrice, 0));
  const small = listings.filter((l) => !isLargeItem(l));
  const large = listings.filter((l) => isLargeItem(l));
  const smallSubtotal = round2(small.reduce((s, l) => s + l.effectivePrice, 0));
  const fee = buyerFee(itemSubtotal);

  let postage: number | null = 0;
  let postageLabel = "";
  let freeShipping = false;
  let freeShippingGap: number | undefined;

  if (method === "pickup" || method === "meetup") {
    postageLabel =
      method === "pickup" ? `Pickup${opts.sellerSuburb ? ` in ${opts.sellerSuburb}` : ""} · no postage` : "Meetup · no postage";
  } else {
    // Small items travel together in one satchel; free over the threshold.
    let smallPostage = 0;
    const satchel = bundleSatchel(small);
    if (small.length && satchel) {
      if (smallSubtotal >= FREE_SHIPPING_THRESHOLD) {
        freeShipping = true;
      } else {
        smallPostage = SATCHELS[satchel].price;
        freeShippingGap = round2(FREE_SHIPPING_THRESHOLD - smallSubtotal);
      }
    }
    // Large items are never free; quoted per item.
    let largePostage: number | null = 0;
    if (large.length) {
      largePostage = opts.distanceKm == null ? null : round2(large.length * courierQuote(opts.distanceKm));
    }
    postage = largePostage == null ? null : round2(smallPostage + largePostage);

    if (method === "post") {
      postageLabel = freeShipping ? "Free postage" : satchel ? satchelLabel(satchel) : "Postage";
    } else {
      postageLabel =
        postage == null
          ? "Courier · calculated at checkout"
          : `Courier${small.length && !freeShipping && satchel ? " + satchel" : ""} · ${formatMoney(postage)}`;
    }
  }

  const total = round2(itemSubtotal + (postage ?? 0) + fee);
  return { itemSubtotal, postage, postageLabel, freeShipping, buyerFee: fee, total, freeShippingGap };
}

/** "$1,262.50" or "$1,262.50 + shipping" when postage isn't known yet. */
export function totalLabel(p: OrderPricing): string {
  return p.postage == null ? `${formatMoney(p.total)} + shipping` : formatMoney(p.total);
}

export const isTooFarForPickup = (distanceKm?: number | null) => distanceKm != null && distanceKm > MAX_PICKUP_DISTANCE_KM;

/**
 * The delivery method to pre-select: the first available, except that a
 * pickup/meetup too far away gives way to post or courier when offered.
 */
export function defaultMethod(methods: DeliveryMethod[], distanceKm?: number | null): DeliveryMethod | undefined {
  if (isTooFarForPickup(distanceKm)) {
    const shipped = methods.find((m) => m === "post" || m === "large_calculated");
    if (shipped) return shipped;
  }
  return methods[0];
}

/** Delivery tag on a card where the buyer hasn't chosen delivery yet. */
export function cardShippingTag(l: Listing, distanceKm?: number | null): { kind: "free" | "pickup" | "postage" | "courier" | "far"; label: string } {
  const handover = l.delivery.pickup || l.delivery.meetup;
  const far = isTooFarForPickup(distanceKm);
  if (!isLargeItem(l) && l.delivery.post && l.price >= FREE_SHIPPING_THRESHOLD) return { kind: "free", label: "Free post" };
  if (handover && !far) return { kind: "pickup", label: l.delivery.pickup ? "Pickup" : "Meetup" };
  if (isLargeItem(l) ? l.delivery.largeCalculated : l.delivery.post) {
    return isLargeItem(l) ? { kind: "courier", label: "+ shipping" } : { kind: "postage", label: "+ postage" };
  }
  return { kind: "far", label: `Pickup only · ${Math.round(distanceKm ?? 0)} km` };
}
