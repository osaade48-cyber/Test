/**
 * Orders, escrow, handover and disputes (buyer/seller side).
 * Every status change goes through `transition()`, which enforces the
 * state machine in lib/orderState.ts. The backend must do the same.
 */
import type { DeliveryMethod, DisputeReason, Order, OrderStatus, Review, User } from "@/types/models";
import { assertTransition, isHandoverMethod, type Actor } from "@/lib/orderState";
import { haversineKm, priceOrder } from "@/lib/pricing";
import { sixDigitCode, uid } from "@/lib/id";
import { AUTO_CONFIRM_DAYS } from "@/config/business";
import { db, latency, nowIso, persist, ServiceError } from "./mock/db";
import { requireUserId } from "./auth";
import { emit } from "./events";
import { buildBundles } from "./cart";

export interface OrderWithPeople extends Order {
  buyer: User;
  seller: User;
  role: "buyer" | "seller";
}

function withPeople(o: Order, me: string): OrderWithPeople {
  return {
    ...o,
    buyer: db.users.find((u) => u.id === o.buyerId)!,
    seller: db.users.find((u) => u.id === o.sellerId)!,
    role: o.buyerId === me ? "buyer" : "seller",
  };
}

function findMine(id: string, me: string): Order {
  const o = db.orders.find((x) => x.id === id);
  if (!o || (o.buyerId !== me && o.sellerId !== me && !db.users.find((u) => u.id === me)?.isAdmin)) {
    throw new ServiceError("Order not found", "not_found");
  }
  return o;
}

function notify(userId: string, title: string, body: string, href: string) {
  db.notifications.unshift({ id: uid("n"), userId, kind: "order", title, body, href, read: false, createdAt: nowIso() });
}

function postSystemMessage(o: Order, body: string) {
  const conv = db.conversations.find(
    (c) => c.participantIds.includes(o.buyerId) && c.participantIds.includes(o.sellerId) && o.items.some((i) => i.listingId === c.listingId),
  );
  if (!conv) return;
  db.messages.push({ id: uid("m"), conversationId: conv.id, senderId: "system", body, system: true, sentAt: nowIso() });
  conv.lastMessageAt = nowIso();
}

/** The one place order status changes. */
export function transition(o: Order, to: OrderStatus, by: Actor, note?: string) {
  assertTransition(o.method, o.status, to, by);
  o.status = to;
  o.updatedAt = nowIso();
  o.history.push({ at: o.updatedAt, status: to, note });
  // Escrow side effects
  const payout = db.payouts.find((p) => p.orderId === o.id);
  if (to === "completed") {
    if (payout) payout.status = "available";
    const seller = db.users.find((u) => u.id === o.sellerId);
    if (seller) seller.completedSales += 1;
  }
  if (to === "refunded" || to === "cancelled") {
    if (payout) payout.status = "reversed";
    for (const it of o.items) {
      const l = db.listings.find((x) => x.id === it.listingId);
      if (l && (l.status === "reserved" || l.status === "sold")) l.status = "active";
    }
  }
}

export async function getOrders(role: "buyer" | "seller"): Promise<OrderWithPeople[]> {
  const me = requireUserId();
  const list = db.orders
    .filter((o) => (role === "buyer" ? o.buyerId === me : o.sellerId === me))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((o) => withPeople(o, me));
  return latency(list);
}

export async function getOrder(id: string): Promise<OrderWithPeople> {
  const me = requireUserId();
  return latency(withPeople(findMine(id, me), me));
}

/**
 * Create one order per seller from the cart (or a single "Buy now").
 * Orders start in pending_payment; payments.payForOrders moves them on.
 */
export async function createOrdersFromCart(sellerIds?: string[]): Promise<Order[]> {
  const me = requireUserId();
  const bundles = buildBundles().filter((b) => !sellerIds || sellerIds.includes(b.seller.id));
  if (!bundles.length) throw new ServiceError("Your bundle is empty.", "empty");
  const created: Order[] = [];
  for (const b of bundles) {
    const order: Order = {
      id: uid("o"),
      number: `KD-${Math.floor(3000 + Math.random() * 6000)}`,
      buyerId: me,
      sellerId: b.seller.id,
      items: b.listings.map((l) => ({
        listingId: l.id, title: l.title, brand: l.brand, category: l.category, size: l.size, photo: l.photos[0], price: l.effectivePrice,
      })),
      method: b.method,
      pricing: b.pricing,
      status: "pending_payment",
      history: [{ at: nowIso(), status: "pending_payment" }],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.orders.push(order);
    created.push(order);
  }
  persist();
  emit("orders");
  return latency(created);
}

export async function createBuyNowOrder(listingId: string, method: DeliveryMethod, offerPrice?: number): Promise<Order> {
  const me = requireUserId();
  const l = db.listings.find((x) => x.id === listingId && x.status === "active");
  if (!l) throw new ServiceError("This item is no longer available.", "unavailable");
  if (l.sellerId === me) throw new ServiceError("You can't buy your own listing.", "own_listing");
  const buyer = db.users.find((u) => u.id === me)!;
  const seller = db.users.find((u) => u.id === l.sellerId)!;
  const price = offerPrice ?? l.price;
  const pricing = priceOrder([{ ...l, effectivePrice: price }], method, {
    distanceKm: haversineKm(buyer.location, seller.location),
    sellerSuburb: seller.location.suburb,
  });
  const order: Order = {
    id: uid("o"),
    number: `KD-${Math.floor(3000 + Math.random() * 6000)}`,
    buyerId: me,
    sellerId: l.sellerId,
    items: [{ listingId: l.id, title: l.title, brand: l.brand, category: l.category, size: l.size, photo: l.photos[0], price }],
    method,
    pricing,
    status: "pending_payment",
    history: [{ at: nowIso(), status: "pending_payment" }],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.orders.push(order);
  persist();
  emit("orders");
  return latency(order);
}

/** Called by payments after a successful (mock) charge. */
export function markPaidSync(orderId: string) {
  const o = db.orders.find((x) => x.id === orderId)!;
  transition(o, "paid_in_escrow", "system");
  for (const it of o.items) {
    const l = db.listings.find((x) => x.id === it.listingId);
    if (l) l.status = isHandoverMethod(o.method) ? "reserved" : "sold";
  }
  db.payouts.push({ id: uid("po"), sellerId: o.sellerId, orderId: o.id, amount: o.pricing.itemSubtotal, status: "held", createdAt: nowIso() });
  if (isHandoverMethod(o.method)) {
    const code = sixDigitCode();
    o.handover = { code, qrPayload: `kindo:handover:${o.id}:${code}` };
    transition(o, "ready_for_handover", "system");
  }
  // remove purchased items from the cart
  db.cart.items = db.cart.items.filter((i) => !o.items.some((it) => it.listingId === i.listingId));
  emit("cart");
  notify(o.sellerId, "You made a sale!", `${o.items[0].title}${o.items.length > 1 ? ` + ${o.items.length - 1} more` : ""}`, `/orders/${o.id}`);
}

export async function markShipped(orderId: string, carrier: string, trackingNumber: string): Promise<Order> {
  const me = requireUserId();
  const o = findMine(orderId, me);
  if (o.sellerId !== me) throw new ServiceError("Only the seller can mark this as shipped.", "forbidden");
  transition(o, "shipped", "seller");
  o.shipment = { carrier, trackingNumber, shippedAt: nowIso() };
  notify(o.buyerId, "Your order has shipped", `${carrier} · ${trackingNumber}`, `/orders/${o.id}`);
  persist();
  emit("orders", "notifications");
  return latency(o);
}

/** Mock only: pretend the carrier scanned it as delivered. */
export async function simulateDelivered(orderId: string): Promise<Order> {
  const me = requireUserId();
  const o = findMine(orderId, me);
  transition(o, "delivered", "system");
  const at = nowIso();
  o.shipment = { ...o.shipment!, deliveredAt: at, autoConfirmAt: new Date(Date.now() + AUTO_CONFIRM_DAYS * 864e5).toISOString() };
  persist();
  emit("orders");
  return latency(o);
}

export async function confirmReceived(orderId: string): Promise<Order> {
  const me = requireUserId();
  const o = findMine(orderId, me);
  if (o.buyerId !== me) throw new ServiceError("Only the buyer can confirm.", "forbidden");
  transition(o, "completed", "buyer", "Buyer confirmed they received the item");
  notify(o.sellerId, "Payment released", `${o.number} is complete — funds are on their way to you.`, `/orders/${o.id}`);
  persist();
  emit("orders", "notifications");
  return latency(o);
}

/** Buyer scanned the seller's QR (or typed the 6-digit code). */
export async function confirmHandover(orderId: string, codeOrPayload: string): Promise<Order> {
  const me = requireUserId();
  const o = findMine(orderId, me);
  if (o.buyerId !== me) throw new ServiceError("Only the buyer can confirm the handover.", "forbidden");
  if (!o.handover) throw new ServiceError("This order doesn't use a handover.", "invalid");
  const input = codeOrPayload.trim();
  const ok = input === o.handover.code || input === o.handover.qrPayload;
  if (!ok) {
    await latency(null);
    throw new ServiceError("That code doesn't match. Check the seller's screen and try again.", "bad_code");
  }
  o.handover.confirmedAt = nowIso();
  transition(o, "completed", "buyer", "Handover confirmed with QR code");
  for (const it of o.items) {
    const l = db.listings.find((x) => x.id === it.listingId);
    if (l) l.status = "sold";
  }
  notify(o.sellerId, "Handover confirmed — payment released", `${o.number} is complete.`, `/orders/${o.id}`);
  postSystemMessage(o, `Handover confirmed for ${o.number}. Payment has been released to the seller.`);
  persist();
  emit("orders", "notifications", "messages");
  return latency(o);
}

export type CancelReason = "seller_no_show" | "buyer_no_show" | "changed_mind" | "item_unavailable" | "other";

export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  seller_no_show: "The seller didn't show up",
  buyer_no_show: "The buyer didn't show up",
  changed_mind: "We agreed to cancel",
  item_unavailable: "The item is no longer available",
  other: "Something else",
};

/**
 * Cancel before completion. If the buyer has paid, the refund is automatic.
 * TODO(stripe): issue the refund via payments.refund.
 */
export async function cancelOrder(orderId: string, reason: CancelReason): Promise<Order> {
  const me = requireUserId();
  const o = findMine(orderId, me);
  const actor: Actor = o.buyerId === me ? "buyer" : "seller";
  const wasPaid = o.status !== "pending_payment";
  transition(o, "cancelled", actor, CANCEL_REASON_LABEL[reason]);
  if (wasPaid) {
    transition(o, "refunded", "system", "Automatic refund to original payment method");
    o.refundAmount = o.pricing.total;
  }
  const other = actor === "buyer" ? o.sellerId : o.buyerId;
  notify(other, `Order ${o.number} was cancelled`, CANCEL_REASON_LABEL[reason], `/orders/${o.id}`);
  postSystemMessage(o, `Order ${o.number} was cancelled: ${CANCEL_REASON_LABEL[reason].toLowerCase()}.${wasPaid ? " The buyer is being refunded in full." : ""}`);
  persist();
  emit("orders", "notifications", "listings", "messages");
  return latency(o);
}

export async function raiseDispute(orderId: string, reason: DisputeReason, details: string): Promise<Order> {
  const me = requireUserId();
  const o = findMine(orderId, me);
  if (o.buyerId !== me) throw new ServiceError("Only the buyer can raise an issue.", "forbidden");
  transition(o, "disputed", "buyer", "Buyer raised an issue");
  const id = uid("d");
  db.disputes.push({
    id, caseNumber: `CASE-${Math.floor(1000 + Math.random() * 9000)}`, orderId: o.id, buyerId: o.buyerId, sellerId: o.sellerId,
    reason, details, status: "needs_ruling", openedAt: nowIso(),
  });
  o.disputeId = id;
  notify(o.sellerId, "The buyer raised an issue", `${o.number}: payment is held until Kindo decides.`, `/orders/${o.id}`);
  persist();
  emit("orders", "notifications", "admin");
  return latency(o);
}

export async function leaveReview(orderId: string, rating: Review["rating"], comment: string): Promise<void> {
  const me = requireUserId();
  const o = findMine(orderId, me);
  if (o.status !== "completed" && o.status !== "partially_refunded") throw new ServiceError("You can review once the order is complete.", "invalid");
  const role = o.buyerId === me ? "buyer" : "seller";
  const subjectId = role === "buyer" ? o.sellerId : o.buyerId;
  db.reviews.push({ id: uid("rv"), orderId, authorId: me, subjectId, role, rating, comment, createdAt: nowIso() });
  if (role === "buyer") o.buyerReviewed = true;
  else o.sellerReviewed = true;
  const subject = db.users.find((u) => u.id === subjectId)!;
  const theirs = db.reviews.filter((r) => r.subjectId === subjectId);
  subject.reviewCount = theirs.length;
  subject.rating = Math.round((theirs.reduce((s, r) => s + r.rating, 0) / theirs.length) * 10) / 10;
  persist();
  emit("orders");
  await latency(null);
}
