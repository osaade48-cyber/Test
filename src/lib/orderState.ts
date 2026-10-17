/**
 * Order state machine — the single source of truth for which transitions are
 * allowed and how each status is presented. UI badges and buttons read from
 * here; the backend must enforce the same transitions.
 *
 *   Post:           pending_payment → paid_in_escrow → shipped → delivered → completed
 *   Pickup/meetup:  pending_payment → paid_in_escrow → ready_for_handover → completed
 *   Side states:    cancelled, disputed, refunded, partially_refunded
 *
 * Funds are released to the seller ONLY on `completed`.
 */
import type { DeliveryMethod, OrderStatus } from "@/types/models";

export type Actor = "buyer" | "seller" | "system" | "admin";

interface Transition {
  to: OrderStatus;
  by: Actor[];
}

const POST_FLOW: Partial<Record<OrderStatus, Transition[]>> = {
  pending_payment: [
    { to: "paid_in_escrow", by: ["system"] },
    { to: "cancelled", by: ["buyer", "system"] },
  ],
  paid_in_escrow: [
    { to: "shipped", by: ["seller"] },
    { to: "cancelled", by: ["seller", "admin"] },
  ],
  shipped: [
    { to: "delivered", by: ["system"] },
    { to: "completed", by: ["buyer"] },
    { to: "disputed", by: ["buyer"] },
  ],
  delivered: [
    { to: "completed", by: ["buyer", "system"] },
    { to: "disputed", by: ["buyer"] },
  ],
};

const HANDOVER_FLOW: Partial<Record<OrderStatus, Transition[]>> = {
  pending_payment: [
    { to: "paid_in_escrow", by: ["system"] },
    { to: "cancelled", by: ["buyer", "system"] },
  ],
  paid_in_escrow: [
    { to: "ready_for_handover", by: ["system", "seller"] },
    { to: "cancelled", by: ["buyer", "seller", "admin"] },
  ],
  ready_for_handover: [
    { to: "completed", by: ["buyer"] },
    { to: "cancelled", by: ["buyer", "seller", "admin"] },
    { to: "disputed", by: ["buyer"] },
  ],
};

const SIDE: Partial<Record<OrderStatus, Transition[]>> = {
  disputed: [
    { to: "refunded", by: ["admin"] },
    { to: "partially_refunded", by: ["admin"] },
    { to: "completed", by: ["admin"] },
  ],
  cancelled: [{ to: "refunded", by: ["system"] }],
};

export const isHandoverMethod = (m: DeliveryMethod) => m === "pickup" || m === "meetup";

export function transitionsFor(method: DeliveryMethod, from: OrderStatus): Transition[] {
  const flow = isHandoverMethod(method) ? HANDOVER_FLOW : POST_FLOW;
  return flow[from] ?? SIDE[from] ?? [];
}

export function canTransition(method: DeliveryMethod, from: OrderStatus, to: OrderStatus, by: Actor): boolean {
  return transitionsFor(method, from).some((t) => t.to === to && t.by.includes(by));
}

export class InvalidTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus, by: Actor) {
    super(`Order can't move from ${from} to ${to} (by ${by}).`);
  }
}

export function assertTransition(method: DeliveryMethod, from: OrderStatus, to: OrderStatus, by: Actor) {
  if (!canTransition(method, from, to, by)) throw new InvalidTransitionError(from, to, by);
}

/** Only `completed` releases funds. */
export const fundsReleased = (s: OrderStatus) => s === "completed";
export const fundsHeld = (s: OrderStatus) =>
  s === "paid_in_escrow" || s === "shipped" || s === "delivered" || s === "ready_for_handover" || s === "disputed";
export const isTerminal = (s: OrderStatus) =>
  s === "completed" || s === "refunded" || s === "partially_refunded" || s === "cancelled";

export type Tone = "neutral" | "info" | "success" | "warn" | "danger" | "lilac";

export const STATUS_META: Record<OrderStatus, { label: string; tone: Tone; buyerHint: string; sellerHint: string }> = {
  pending_payment: {
    label: "Awaiting payment",
    tone: "neutral",
    buyerHint: "Finish paying to secure this item.",
    sellerHint: "Waiting for the buyer to pay.",
  },
  paid_in_escrow: {
    label: "Paid · held securely",
    tone: "info",
    buyerHint: "Your payment is held securely. The seller is preparing your item.",
    sellerHint: "Payment is held securely. Post the item or arrange the handover.",
  },
  shipped: {
    label: "Shipped",
    tone: "info",
    buyerHint: "On its way. Confirm once it arrives and you've checked it.",
    sellerHint: "On its way to the buyer.",
  },
  delivered: {
    label: "Delivered",
    tone: "lilac",
    buyerHint: "Check the item, then confirm or raise an issue.",
    sellerHint: "Delivered. Payment releases when the buyer confirms, or automatically.",
  },
  ready_for_handover: {
    label: "Ready for pickup",
    tone: "lilac",
    buyerHint: "Meet the seller, inspect the item, then scan their QR code.",
    sellerHint: "Show your QR code to the buyer once they've inspected the item.",
  },
  completed: {
    label: "Completed",
    tone: "success",
    buyerHint: "All done. Leave a review for the seller.",
    sellerHint: "Payment released to you.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "neutral",
    buyerHint: "This order was cancelled.",
    sellerHint: "This order was cancelled.",
  },
  disputed: {
    label: "Issue raised",
    tone: "warn",
    buyerHint: "Kindo is reviewing this order. Your payment stays held until we decide.",
    sellerHint: "The buyer raised an issue. Payment stays held until Kindo decides.",
  },
  refunded: {
    label: "Refunded",
    tone: "neutral",
    buyerHint: "You've been refunded in full.",
    sellerHint: "The buyer was refunded.",
  },
  partially_refunded: {
    label: "Partially refunded",
    tone: "neutral",
    buyerHint: "You received a partial refund.",
    sellerHint: "The buyer received a partial refund; the rest was released to you.",
  },
};

/** The happy-path steps for a progress tracker. */
export function happyPath(method: DeliveryMethod): OrderStatus[] {
  return isHandoverMethod(method)
    ? ["paid_in_escrow", "ready_for_handover", "completed"]
    : ["paid_in_escrow", "shipped", "delivered", "completed"];
}
