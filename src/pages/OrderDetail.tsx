import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Calendar, Check, MapPin, MessageCircle, PackageCheck, RotateCcw, Star, Truck, Undo2 } from "lucide-react";
import type { DisputeReason, Review } from "@/types/models";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import {
  CANCEL_REASON_LABEL,
  cancelOrder,
  confirmReceived,
  getOrder,
  leaveReview,
  markShipped,
  raiseDispute,
  simulateDelivered,
  type CancelReason,
  type OrderWithPeople,
} from "@/services/orders";
import { openConversation } from "@/services/messages";
import { ErrorState, RowSkeleton } from "@/components/ui/states";
import { Avatar, Badge, Card, Notice } from "@/components/ui/primitives";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal, useToast } from "@/components/ui/overlay";
import { ListingImage } from "@/components/listing/ListingImage";
import { ReleasePaymentModal, SellerHandoverCard } from "@/components/order/Handover";
import { happyPath, isHandoverMethod, STATUS_META, canTransition } from "@/lib/orderState";
import { METHOD_LABEL } from "@/lib/pricing";
import { formatDate, formatDateTime, formatMoney, formatShortDay } from "@/lib/format";
import { cn } from "@/lib/cn";
import { AUTO_CONFIRM_DAYS, FEATURES, REFUND_BUSINESS_DAYS } from "@/config/business";
import { PAYOUT_RULE_MEETUP, PAYOUT_RULE_POST } from "@/config/copy";

export default function OrderDetail() {
  return (
    <RequireAuth title="Sign in to see this order">
      <OrderDetailInner />
    </RequireAuth>
  );
}

function Progress({ o }: { o: OrderWithPeople }) {
  const steps = happyPath(o.method);
  const idx = steps.indexOf(o.status);
  const off = idx < 0;
  return (
    <ol className="flex items-start gap-1" aria-label="Order progress">
      {steps.map((s, i) => {
        const done = !off && i <= idx;
        return (
          <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-caption", done ? "bg-ink text-on-ink" : "bg-surface-2 text-muted")}>
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn("text-[11px] leading-tight", done ? "font-semibold text-ink" : "text-muted")}>{STATUS_META[s].label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderDetailInner() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const state = useAsync(() => getOrder(id), [id], ["orders"]);
  const [modal, setModal] = useState<null | "ship" | "confirm" | "release" | "cancel" | "dispute" | "review">(null);
  const [busy, setBusy] = useState(false);

  if (state.error) return <div className="page"><ErrorState error={state.error} onRetry={state.reload} /></div>;
  if (!state.data) return <div className="page max-w-2xl"><RowSkeleton count={3} /></div>;
  const o = state.data;
  const meta = STATUS_META[o.status];
  const buyer = o.role === "buyer";
  const other = buyer ? o.seller : o.buyer;
  const handover = isHandoverMethod(o.method);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast(msg);
      setModal(null);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const canCancel = canTransition(o.method, o.status, "cancelled", buyer ? "buyer" : "seller");
  const canDispute = buyer && canTransition(o.method, o.status, "disputed", "buyer");
  const reviewed = buyer ? o.buyerReviewed : o.sellerReviewed;

  return (
    <div className="page max-w-2xl">
      <div className="flex items-center gap-3">
        <IconButton label="Back" variant="surface" onClick={() => nav("/orders" + (buyer ? "" : "?tab=sales"))}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <div className="min-w-0 flex-1">
          <h1 className="whitespace-nowrap text-h2 md:text-h1">Order {o.number}</h1>
          <p className="text-caption text-muted">{buyer ? "Purchase" : "Sale"} · {formatDate(o.createdAt)}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <Card className="mt-4">
        {!["cancelled", "refunded", "partially_refunded", "disputed"].includes(o.status) && <Progress o={o} />}
        <p className={cn("text-body", !["cancelled", "refunded", "partially_refunded", "disputed"].includes(o.status) && "mt-4")}>{buyer ? meta.buyerHint : meta.sellerHint}</p>

        {/* ── Post flow ── */}
        {o.status === "paid_in_escrow" && !handover && !buyer && (
          <Button className="mt-4" full icon={<Truck className="h-4 w-4" />} onClick={() => setModal("ship")}>Mark as shipped</Button>
        )}
        {o.shipment && (
          <p className="mt-3 text-caption text-muted">
            {o.shipment.carrier} · tracking <span className="font-mono text-ink">{o.shipment.trackingNumber}</span> · shipped {formatDate(o.shipment.shippedAt)}
            {o.shipment.deliveredAt && <> · delivered {formatDate(o.shipment.deliveredAt)}</>}
          </p>
        )}
        {o.status === "delivered" && o.shipment?.autoConfirmAt && (
          <Notice tone="lilac" className="mt-3" icon={<Calendar className="h-4 w-4" />}>
            {buyer
              ? `If you don't raise an issue, payment releases automatically on ${formatDate(o.shipment.autoConfirmAt)} (${AUTO_CONFIRM_DAYS} days after delivery).`
              : `Payment releases when the buyer confirms, or automatically on ${formatDate(o.shipment.autoConfirmAt)}.`}
          </Notice>
        )}
        {buyer && (o.status === "shipped" || o.status === "delivered") && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button icon={<PackageCheck className="h-4 w-4" />} onClick={() => setModal("confirm")}>I've received it</Button>
            <Button variant="secondary" icon={<AlertTriangle className="h-4 w-4" />} onClick={() => setModal("dispute")}>Raise an issue</Button>
          </div>
        )}
        {o.status === "shipped" && (
          <button type="button" className="mt-3 min-h-tap text-caption text-muted underline" onClick={() => run(() => simulateDelivered(o.id), "Marked as delivered (demo)")}>
            Demo: simulate carrier delivery scan
          </button>
        )}

        {/* ── Handover flow ── */}
        {o.status === "ready_for_handover" && o.handover && (
          <div className="mt-4 space-y-3">
            <p className="flex items-center gap-2 text-body">
              <MapPin className="h-4 w-4 text-brand" aria-hidden />
              {o.handover.meetingPoint ?? (o.method === "pickup" ? `Pickup in ${o.seller.location.suburb}` : "Meetup — agree a public place in Messages")}
              {o.handover.scheduledFor && <span className="text-muted">· {formatShortDay(o.handover.scheduledFor)}</span>}
            </p>
            {buyer ? (
              <>
                <Button full size="lg" icon={<Check className="h-5 w-5" />} onClick={() => setModal("release")}>
                  I've inspected it — release payment
                </Button>
                <p className="text-caption text-muted">{PAYOUT_RULE_MEETUP}</p>
              </>
            ) : (
              FEATURES.qrHandover && <SellerHandoverCard handover={o.handover} />
            )}
          </div>
        )}
        {o.handover?.confirmedAt && <p className="mt-3 text-caption text-success">Handover confirmed {formatDateTime(o.handover.confirmedAt)}</p>}

        {/* ── Side states ── */}
        {o.status === "disputed" && (
          <Notice tone="warn" className="mt-3" icon={<AlertTriangle className="h-4 w-4" />} title="Payment is on hold">
            Kindo is reviewing this order and will contact you both. Funds stay held until we decide.
          </Notice>
        )}
        {(o.status === "refunded" || o.status === "partially_refunded") && (
          <Notice tone="info" className="mt-3" icon={<Undo2 className="h-4 w-4" />} title={o.status === "refunded" ? `${formatMoney(o.refundAmount ?? o.pricing.total)} refunded` : `${formatMoney(o.refundAmount ?? 0)} refunded`}>
            {buyer ? `Refunds go back to your original payment method within ${REFUND_BUSINESS_DAYS} business days.` : "The buyer has been refunded."}
          </Notice>
        )}
        {o.status === "cancelled" && <p className="mt-2 text-caption text-muted">{o.history[o.history.length - 1]?.note}</p>}

        {/* ── Completed ── */}
        {(o.status === "completed" || o.status === "partially_refunded") && FEATURES.reviewsAndTrustTiers && !reviewed && (
          <Button className="mt-4" full variant="secondary" icon={<Star className="h-4 w-4" />} onClick={() => setModal("review")}>
            Rate {other.name.split(" ")[0]}
          </Button>
        )}
        {reviewed && <p className="mt-3 text-caption text-success">Thanks for leaving a review.</p>}
        {buyer && o.status === "completed" && FEATURES.quickRelist && (
          <Button className="mt-2" full variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={() => nav(`/sell?from=${o.items[0].listingId}`)}>
            Outgrown it? Sell one like this
          </Button>
        )}
      </Card>

      {/* Items */}
      <Card className="mt-4">
        <h2 className="text-h3">Items</h2>
        <ul className="mt-3 space-y-3">
          {o.items.map((it) => (
            <li key={it.listingId} className="flex items-center gap-3">
              <Link to={`/listing/${it.listingId}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-2">
                <ListingImage photo={it.photo} iconSize={28} />
              </Link>
              <span className="min-w-0 flex-1">
                <Link to={`/listing/${it.listingId}`} className="line-clamp-2 font-medium">{it.title}</Link>
                <span className="text-caption text-muted">{it.brand}{it.size && ` · Size ${it.size}`}</span>
              </span>
              <span>{formatMoney(it.price)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-line pt-3 text-body">
          <div className="flex justify-between"><dt className="text-muted">Items</dt><dd>{formatMoney(o.pricing.itemSubtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{o.method === "pickup" ? `Pickup in ${o.seller.location.suburb}` : METHOD_LABEL[o.method]}</dt><dd>{o.pricing.postage ? formatMoney(o.pricing.postage) : "Free"}</dd></div>
          {buyer ? (
            <>
              <div className="flex justify-between"><dt className="text-muted">Buyer protection</dt><dd>{formatMoney(o.pricing.buyerFee)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>You paid</dt><dd>{formatMoney(o.pricing.total)}</dd></div>
            </>
          ) : (
            <div className="flex justify-between font-semibold"><dt>You receive</dt><dd>{formatMoney(o.pricing.itemSubtotal - (o.status === "partially_refunded" ? o.refundAmount ?? 0 : 0))}</dd></div>
          )}
        </dl>
        <p className="mt-3 text-caption text-muted">{handover ? PAYOUT_RULE_MEETUP : PAYOUT_RULE_POST}</p>
      </Card>

      {/* Other party */}
      <Card className="mt-4">
        <div className="flex items-center gap-3">
          <Avatar name={other.name} color={other.avatarColor} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted">{buyer ? "Seller" : "Buyer"}</p>
            <Link to={`/u/${other.id}`} className="font-semibold hover:underline">{other.name.split(" ")[0]}</Link>
          </div>
          {buyer && (
            <Button variant="secondary" size="sm" icon={<MessageCircle className="h-4 w-4" />} onClick={async () => nav(`/messages/${await openConversation(o.items[0].listingId)}`)}>
              Message
            </Button>
          )}
        </div>
      </Card>

      {/* History */}
      <Card className="mt-4">
        <h2 className="text-h3">Timeline</h2>
        <ol className="mt-3 space-y-2 border-l border-line pl-4">
          {[...o.history].reverse().map((h, i) => (
            <li key={i} className="text-caption">
              <span className="font-medium text-ink">{STATUS_META[h.status].label}</span> · <span className="text-muted">{formatDateTime(h.at)}</span>
              {h.note && <span className="block text-muted">{h.note}</span>}
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        {canCancel && (
          <Button variant="ghost" onClick={() => setModal("cancel")}>
            {handover && o.status === "ready_for_handover" ? "Cancel / no-show" : "Cancel order"}
          </Button>
        )}
        {canDispute && o.status === "ready_for_handover" && (
          <Button variant="ghost" onClick={() => setModal("dispute")}>Raise an issue</Button>
        )}
      </div>

      {/* Modals */}
      <ShipModal open={modal === "ship"} onClose={() => setModal(null)} busy={busy} onSubmit={(c, t) => run(() => markShipped(o.id, c, t), "Marked as shipped")} />
      <Modal
        open={modal === "confirm"}
        onClose={() => setModal(null)}
        title="Confirm you've received it"
        footer={<Button full loading={busy} onClick={() => run(() => confirmReceived(o.id), "Payment released")}>Yes, release {formatMoney(o.pricing.itemSubtotal)} to the seller</Button>}
      >
        <Notice tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>Only confirm once you've checked the item. If something's wrong, raise an issue instead — you can't undo this.</Notice>
      </Modal>
      {o.handover && (
        <ReleasePaymentModal open={modal === "release"} onClose={() => setModal(null)} orderId={o.id} amount={o.pricing.itemSubtotal} demoCode={o.handover.code} onDone={state.reload} />
      )}
      <CancelModal open={modal === "cancel"} onClose={() => setModal(null)} busy={busy} buyer={buyer} paid={o.status !== "pending_payment"} total={o.pricing.total} handover={handover} onSubmit={(r) => run(() => cancelOrder(o.id, r), "Order cancelled")} />
      <DisputeModal open={modal === "dispute"} onClose={() => setModal(null)} busy={busy} onSubmit={(r, d) => run(() => raiseDispute(o.id, r, d), "Issue raised — payment is on hold")} />
      <ReviewModal open={modal === "review"} onClose={() => setModal(null)} busy={busy} name={other.name.split(" ")[0]} onSubmit={(r, c) => run(() => leaveReview(o.id, r, c), "Review posted")} />
    </div>
  );
}

function ShipModal({ open, onClose, onSubmit, busy }: { open: boolean; onClose: () => void; onSubmit: (carrier: string, tracking: string) => void; busy: boolean }) {
  const [carrier, setCarrier] = useState("AusPost");
  const [tracking, setTracking] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Mark as shipped" footer={<Button full disabled={tracking.trim().length < 6} loading={busy} onClick={() => onSubmit(carrier, tracking.trim())}>Save tracking</Button>}>
      <label className="label" htmlFor="carrier">Carrier</label>
      <select id="carrier" className="input" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
        <option>AusPost</option>
        <option>Sendle</option>
        <option>CouriersPlease</option>
        <option>Aramex</option>
      </select>
      <label className="label mt-3" htmlFor="tracking">Tracking number</label>
      <input id="tracking" className="input font-mono" value={tracking} onChange={(e) => setTracking(e.target.value)} />
      <p className="mt-2 text-caption text-muted">{PAYOUT_RULE_POST}</p>
    </Modal>
  );
}

function CancelModal({ open, onClose, onSubmit, busy, buyer, paid, total, handover }: { open: boolean; onClose: () => void; onSubmit: (r: CancelReason) => void; busy: boolean; buyer: boolean; paid: boolean; total: number; handover: boolean }) {
  const reasons: CancelReason[] = handover ? [buyer ? "seller_no_show" : "buyer_no_show", "changed_mind", "item_unavailable", "other"] : ["changed_mind", "item_unavailable", "other"];
  const [reason, setReason] = useState<CancelReason>(reasons[0]);
  return (
    <Modal open={open} onClose={onClose} title="Cancel this order" footer={<Button full variant="danger" loading={busy} onClick={() => onSubmit(reason)}>Cancel order</Button>}>
      <div className="space-y-2">
        {reasons.map((r) => (
          <label key={r} className="flex min-h-tap cursor-pointer items-center gap-3 rounded-md border border-line px-3">
            <input type="radio" name="cancel" className="h-4 w-4 accent-[rgb(var(--c-ink))]" checked={reason === r} onChange={() => setReason(r)} />
            {CANCEL_REASON_LABEL[r]}
          </label>
        ))}
      </div>
      {paid && (
        <Notice tone="info" className="mt-4" icon={<Undo2 className="h-4 w-4" />}>
          {buyer ? `You'll be refunded ${formatMoney(total)} automatically` : `The buyer will be refunded ${formatMoney(total)} automatically`} — back to the original payment method within {REFUND_BUSINESS_DAYS} business days.
        </Notice>
      )}
    </Modal>
  );
}

const DISPUTE_REASONS: { id: DisputeReason; label: string }[] = [
  { id: "not_as_described", label: "Not as described" },
  { id: "damaged", label: "Arrived damaged" },
  { id: "not_received", label: "Never arrived" },
  { id: "safety_concern", label: "Safety concern" },
  { id: "other", label: "Something else" },
];

function DisputeModal({ open, onClose, onSubmit, busy }: { open: boolean; onClose: () => void; onSubmit: (r: DisputeReason, d: string) => void; busy: boolean }) {
  const [reason, setReason] = useState<DisputeReason>("not_as_described");
  const [details, setDetails] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Raise an issue" footer={<Button full disabled={details.trim().length < 10} loading={busy} onClick={() => onSubmit(reason, details.trim())}>Send to Kindo</Button>}>
      <p className="text-body text-muted">Your payment stays held while Kindo reviews this. We'll message you and the seller.</p>
      <div className="mt-3 space-y-2">
        {DISPUTE_REASONS.map((r) => (
          <label key={r.id} className="flex min-h-tap cursor-pointer items-center gap-3 rounded-md border border-line px-3">
            <input type="radio" name="dispute" className="h-4 w-4 accent-[rgb(var(--c-ink))]" checked={reason === r.id} onChange={() => setReason(r.id)} />
            {r.label}
          </label>
        ))}
      </div>
      <label className="label mt-4" htmlFor="dispute-details">What happened?</label>
      <textarea id="dispute-details" className="input min-h-[110px] py-2" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe the problem. Photos can be sent in Messages." />
    </Modal>
  );
}

function ReviewModal({ open, onClose, onSubmit, busy, name }: { open: boolean; onClose: () => void; onSubmit: (r: Review["rating"], c: string) => void; busy: boolean; name: string }) {
  const [rating, setRating] = useState<Review["rating"]>(5);
  const [comment, setComment] = useState("");
  return (
    <Modal open={open} onClose={onClose} title={`Rate ${name}`} footer={<Button full loading={busy} onClick={() => onSubmit(rating, comment.trim())}>Post review</Button>}>
      <div className="flex justify-center gap-1" role="radiogroup" aria-label="Rating">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="flex h-tap w-tap items-center justify-center">
            <Star className={cn("h-8 w-8", n <= rating ? "fill-warn text-warn" : "text-line")} aria-hidden />
          </button>
        ))}
      </div>
      <label className="label mt-4" htmlFor="review">Comment</label>
      <textarea id="review" className="input min-h-[90px] py-2" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How did it go?" />
    </Modal>
  );
}
