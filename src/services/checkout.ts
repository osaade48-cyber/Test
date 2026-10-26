/**
 * Checkout. The buyer sees a quote first; orders are only created when
 * payment succeeds, so abandoned checkouts leave nothing behind.
 *
 * TODO(stripe): getCheckoutQuote → server creates a PaymentIntent for the
 * quoted total; placeOrder → confirm it with Stripe.js and create the
 * orders from the `payment_intent.succeeded` webhook.
 */
import type { DeliveryMethod, SellerBundle } from "@/types/models";
import { db, latency, persist, ServiceError } from "./mock/db";
import { requireUserId } from "./auth";
import { emit } from "./events";
import { buildBundles } from "./cart";
import { createBuyNowOrder, createOrdersFromCart } from "./orders";
import { payForOrders } from "./payments";

export type CheckoutSpec =
  | { kind: "buy_now"; listingId: string; method: DeliveryMethod; offerPrice?: number }
  | { kind: "cart"; sellerIds?: string[] };

/** Build the checkout URL for a spec. */
export function checkoutPath(spec: CheckoutSpec): string {
  const sp = new URLSearchParams();
  if (spec.kind === "buy_now") {
    sp.set("listing", spec.listingId);
    sp.set("method", spec.method);
    if (spec.offerPrice != null) sp.set("offer", String(spec.offerPrice));
  } else if (spec.sellerIds?.length) sp.set("sellers", spec.sellerIds.join(","));
  return `/checkout?${sp.toString()}`;
}

export function specFromParams(sp: URLSearchParams): CheckoutSpec {
  const listingId = sp.get("listing");
  if (listingId) {
    const offer = sp.get("offer");
    return { kind: "buy_now", listingId, method: (sp.get("method") as DeliveryMethod) || "post", offerPrice: offer ? Number(offer) : undefined };
  }
  const sellers = sp.get("sellers");
  return { kind: "cart", sellerIds: sellers ? sellers.split(",").filter(Boolean) : undefined };
}

/** Price what the buyer is about to pay. Creates nothing. */
export async function getCheckoutQuote(spec: CheckoutSpec): Promise<SellerBundle[]> {
  const me = requireUserId();
  if (spec.kind === "buy_now") {
    const l = db.listings.find((x) => x.id === spec.listingId);
    if (!l || l.status !== "active") throw new ServiceError("Sorry — this item is no longer available.", "unavailable");
    if (l.sellerId === me) throw new ServiceError("You can't buy your own listing.", "own_listing");
    return latency(buildBundles([{ listingId: l.id, addedAt: new Date().toISOString(), offerPrice: spec.offerPrice }], { [l.sellerId]: spec.method }));
  }
  return latency(buildBundles().filter((b) => !spec.sellerIds || spec.sellerIds.includes(b.seller.id)));
}

/** Take payment and create the orders. If payment fails, nothing is kept. */
export async function placeOrder(spec: CheckoutSpec): Promise<{ orderIds: string[] }> {
  requireUserId();
  const orders =
    spec.kind === "buy_now"
      ? [await createBuyNowOrder(spec.listingId, spec.method, spec.offerPrice)]
      : await createOrdersFromCart(spec.sellerIds);
  const ids = orders.map((o) => o.id);
  try {
    const res = await payForOrders(ids);
    return { orderIds: res.orderIds };
  } catch (e) {
    db.orders = db.orders.filter((o) => !ids.includes(o.id));
    persist();
    emit("orders");
    throw e;
  }
}
