/**
 * Payments, escrow balances, payouts and subscriptions.
 *
 * Nothing here moves real money. Every function that must talk to Stripe is
 * marked TODO(stripe). The intended production design:
 *   - Buyer pays via Stripe Checkout / Payment Element (PaymentIntent with
 *     `transfer_group` = order id). Funds stay on the platform balance.
 *   - On `completed`, create a Transfer to the seller's Connect account.
 *   - Refunds/partial refunds go through the Refunds API before any transfer.
 */
import type { Payout, PayoutAccount, Subscription } from "@/types/models";
import { BOOST_PRICE, PRO_FREE_BOOSTS } from "@/config/business";
import { db, latency, nowIso, persist, ServiceError } from "./mock/db";
import { requireUserId } from "./auth";
import { emit } from "./events";
import { markPaidSync } from "./orders";

export interface CheckoutResult {
  orderIds: string[];
  amountCharged: number;
}

/**
 * Pay for one or more pending orders.
 * TODO(stripe): create a PaymentIntent server-side and confirm it with Stripe.js
 * (VITE_STRIPE_PUBLISHABLE_KEY). Never collect card numbers in our own inputs.
 */
export async function payForOrders(orderIds: string[]): Promise<CheckoutResult> {
  const me = requireUserId();
  const orders = db.orders.filter((o) => orderIds.includes(o.id) && o.buyerId === me && o.status === "pending_payment");
  if (!orders.length) throw new ServiceError("Nothing to pay for.", "empty");
  for (const o of orders) {
    if (o.items.some((it) => db.listings.find((l) => l.id === it.listingId)?.status !== "active")) {
      throw new ServiceError("Sorry — an item in your order has just sold.", "unavailable");
    }
  }
  await latency(null);
  for (const o of orders) markPaidSync(o.id);
  persist();
  emit("orders", "cart", "listings", "notifications");
  return { orderIds: orders.map((o) => o.id), amountCharged: orders.reduce((s, o) => s + o.pricing.total, 0) };
}

export interface Wallet {
  held: number;
  available: number;
  paidOut: number;
  payouts: (Payout & { orderNumber: string; itemTitle: string })[];
  account: PayoutAccount;
}

export async function getWallet(): Promise<Wallet> {
  const me = requireUserId();
  const mine = db.payouts.filter((p) => p.sellerId === me);
  const sum = (s: Payout["status"]) => mine.filter((p) => p.status === s).reduce((a, p) => a + p.amount, 0);
  return latency({
    held: sum("held"),
    available: sum("available"),
    paidOut: sum("paid"),
    payouts: mine
      .map((p) => {
        const o = db.orders.find((x) => x.id === p.orderId);
        return { ...p, orderNumber: o?.number ?? "—", itemTitle: o?.items[0]?.title ?? "Order" };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    account: db.payoutAccount,
  });
}

/** TODO(stripe): create an Account Link for Stripe Connect Express onboarding and redirect. */
export async function startConnectOnboarding(): Promise<PayoutAccount> {
  db.payoutAccount = { status: "active", bankLast4: "4821" };
  persist();
  return latency(db.payoutAccount);
}

/** TODO(stripe): trigger a payout from the Connect balance. */
export async function withdrawAvailable(): Promise<number> {
  const me = requireUserId();
  if (db.payoutAccount.status !== "active") throw new ServiceError("Set up payouts first.", "no_account");
  let total = 0;
  for (const p of db.payouts.filter((x) => x.sellerId === me && x.status === "available")) {
    p.status = "paid";
    p.paidAt = nowIso();
    total += p.amount;
  }
  persist();
  return latency(total);
}

// ─── Kindo Pro ─────────────────────────────────────────────────────────────

export async function getSubscription(): Promise<Subscription> {
  requireUserId();
  return latency(db.subscription);
}

/** TODO(stripe): Stripe Billing subscription via Checkout in `subscription` mode. */
export async function subscribePro(plan: "pro_monthly" | "pro_annual"): Promise<Subscription> {
  const me = requireUserId();
  const renews = new Date();
  if (plan === "pro_monthly") renews.setMonth(renews.getMonth() + 1);
  else renews.setFullYear(renews.getFullYear() + 1);
  db.subscription = { userId: me, plan, status: "active", renewsAt: renews.toISOString(), boostsRemaining: PRO_FREE_BOOSTS };
  const u = db.users.find((x) => x.id === me)!;
  u.isPro = true;
  persist();
  emit("subscription", "auth");
  return latency(db.subscription);
}

/** TODO(stripe): cancel at period end. */
export async function cancelPro(): Promise<Subscription> {
  db.subscription = { ...db.subscription, status: "cancelled" };
  persist();
  emit("subscription");
  return latency(db.subscription);
}

/** TODO(stripe): one-off PaymentIntent for BOOST_PRICE when no Pro credits remain. */
export async function buyBoost(): Promise<{ charged: number }> {
  requireUserId();
  const charged = db.subscription.boostsRemaining > 0 ? 0 : BOOST_PRICE;
  return latency({ charged });
}
