/**
 * Admin moderation: disputes and listing reports.
 * TODO(auth): these endpoints must be restricted to admins server-side.
 * TODO(stripe): rulings trigger refunds / transfers.
 */
import type { Dispute, DisputeOutcome, Listing, Order, Report, User } from "@/types/models";
import { round2 } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { uid } from "@/lib/id";
import { db, latency, nowIso, persist, ServiceError } from "./mock/db";
import { requireUserId } from "./auth";
import { emit } from "./events";
import { transition } from "./orders";

function requireAdmin() {
  const me = requireUserId();
  if (!db.users.find((u) => u.id === me)?.isAdmin) throw new ServiceError("Admins only.", "forbidden");
  return me;
}

export interface DisputeCase extends Dispute {
  order: Order;
  buyer: User;
  seller: User;
}

export interface ReportCase extends Report {
  listing: Listing;
  reporter: User;
  seller: User;
}

export async function getDisputes(): Promise<DisputeCase[]> {
  requireAdmin();
  return latency(
    db.disputes
      .map((d) => ({
        ...d,
        order: db.orders.find((o) => o.id === d.orderId)!,
        buyer: db.users.find((u) => u.id === d.buyerId)!,
        seller: db.users.find((u) => u.id === d.sellerId)!,
      }))
      .filter((d) => d.order)
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt)),
  );
}

export async function ruleDispute(id: string, outcome: DisputeOutcome, note: string, partialAmount?: number): Promise<void> {
  requireAdmin();
  const d = db.disputes.find((x) => x.id === id);
  if (!d || d.status !== "needs_ruling") throw new ServiceError("This case is already resolved.", "invalid");
  const o = db.orders.find((x) => x.id === d.orderId)!;
  let refund = 0;
  if (outcome === "refund_buyer") {
    transition(o, "refunded", "admin", "Kindo refunded the buyer in full");
    refund = o.pricing.total;
  } else if (outcome === "partial_refund") {
    refund = round2(Math.min(partialAmount ?? 0, o.pricing.total));
    if (refund <= 0) throw new ServiceError("Enter a refund amount.", "invalid");
    transition(o, "partially_refunded", "admin", `Kindo refunded ${formatMoney(refund)}`);
    const p = db.payouts.find((x) => x.orderId === o.id);
    if (p) {
      p.amount = round2(Math.max(0, p.amount - refund));
      p.status = "available";
    }
  } else {
    transition(o, "completed", "admin", "Kindo released the payment to the seller");
  }
  o.refundAmount = refund || undefined;
  Object.assign(d, { status: "resolved", outcome, adminNote: note, refundAmount: refund || undefined, resolvedAt: nowIso() });
  for (const userId of [d.buyerId, d.sellerId]) {
    db.notifications.unshift({
      id: uid("n"), userId, kind: "order", title: `Case ${d.caseNumber} resolved`, body: note || "Kindo has made a decision on this order.",
      href: `/orders/${o.id}`, read: false, createdAt: nowIso(),
    });
  }
  persist();
  emit("admin", "orders", "notifications");
  await latency(null);
}

export async function getReports(): Promise<ReportCase[]> {
  requireAdmin();
  return latency(
    db.reports
      .map((r) => {
        const listing = db.listings.find((l) => l.id === r.listingId)!;
        return {
          ...r,
          listing,
          reporter: db.users.find((u) => u.id === r.reporterId)!,
          seller: db.users.find((u) => u.id === listing?.sellerId)!,
        };
      })
      .filter((r) => r.listing)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export type ReportAction = "remove_listing" | "warn_user" | "suspend_user" | "dismiss";

export async function actionReport(id: string, action: ReportAction): Promise<void> {
  requireAdmin();
  const r = db.reports.find((x) => x.id === id);
  if (!r) throw new ServiceError("Report not found", "not_found");
  const listing = db.listings.find((l) => l.id === r.listingId)!;
  const seller = db.users.find((u) => u.id === listing.sellerId)!;
  if (action === "remove_listing") {
    listing.status = "removed";
    r.action = "listing_removed";
  } else if (action === "warn_user") {
    seller.status = "warned";
    r.action = "user_warned";
  } else if (action === "suspend_user") {
    seller.status = "suspended";
    db.listings.filter((l) => l.sellerId === seller.id && l.status === "active").forEach((l) => (l.status = "removed"));
    r.action = "user_suspended";
  } else r.action = "dismissed";
  r.status = action === "dismiss" ? "dismissed" : "actioned";
  r.resolvedAt = nowIso();
  persist();
  emit("admin", "listings");
  await latency(null);
}

/** Any signed-in user can report a listing. */
export async function reportListing(listingId: string, reason: Report["reason"], details: string): Promise<void> {
  const me = requireUserId();
  db.reports.push({ id: uid("r"), listingId, reporterId: me, reason, details, status: "open", createdAt: nowIso() });
  persist();
  emit("admin");
  await latency(null);
}
