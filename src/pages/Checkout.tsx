import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { cancelOrder, getOrder } from "@/services/orders";
import { payForOrders } from "@/services/payments";
import { ErrorState, RowSkeleton, EmptyState } from "@/components/ui/states";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/overlay";
import { ListingImage } from "@/components/listing/ListingImage";
import { METHOD_LABEL, round2 } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { isHandoverMethod } from "@/lib/orderState";
import { BUYER_FEE_RULE, PAYOUT_RULE_MEETUP, PAYOUT_RULE_POST } from "@/config/copy";

export default function Checkout() {
  return (
    <RequireAuth title="Sign in to check out">
      <CheckoutInner />
    </RequireAuth>
  );
}

function CheckoutInner() {
  const [sp] = useSearchParams();
  const ids = (sp.get("orders") ?? "").split(",").filter(Boolean);
  const nav = useNavigate();
  const toast = useToast();
  const [paying, setPaying] = useState(false);
  const state = useAsync(() => Promise.all(ids.map(getOrder)), [ids.join(",")]);

  if (state.error) return <div className="page"><ErrorState error={state.error} onRetry={state.reload} /></div>;
  if (!state.data) return <div className="page max-w-2xl"><RowSkeleton count={2} /></div>;

  const orders = state.data.filter((o) => o.status === "pending_payment");
  if (!orders.length) {
    return (
      <div className="page">
        <EmptyState illustration="bag" title="Nothing to pay for" body="These orders are already paid or were cancelled." action={<ButtonLink to="/orders">View orders</ButtonLink>} />
      </div>
    );
  }

  // Large-item courier quotes are calculated when the order is created, so every total here is final.
  const total = round2(orders.reduce((s, o) => s + o.pricing.total, 0));
  const anyHandover = orders.some((o) => isHandoverMethod(o.method));
  const anyPost = orders.some((o) => !isHandoverMethod(o.method));

  const pay = async () => {
    setPaying(true);
    try {
      const res = await payForOrders(orders.map((o) => o.id)); // TODO(stripe): confirm PaymentIntent
      toast("Payment held securely");
      nav(res.orderIds.length === 1 ? `/orders/${res.orderIds[0]}` : "/orders");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="page max-w-2xl">
      <h1 className="text-h1">Checkout</h1>
      <div className="mt-4 space-y-4">
        {orders.map((o) => (
          <section key={o.id} className="card p-4" aria-label={`Order from ${o.seller.name}`}>
            <p className="text-caption text-muted">
              From {o.seller.name.split(" ")[0]} · {o.method === "pickup" ? `Pickup in ${o.seller.location.suburb}` : METHOD_LABEL[o.method]}
            </p>
            <ul className="mt-2 space-y-2">
              {o.items.map((it) => (
                <li key={it.listingId} className="flex items-center gap-3">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    <ListingImage photo={it.photo} iconSize={24} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{it.title}</span>
                  <span>{formatMoney(it.price)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-body">
              <div className="flex justify-between"><dt className="text-muted">Items</dt><dd>{formatMoney(o.pricing.itemSubtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{o.pricing.postageLabel}</dt><dd>{o.pricing.postage ? formatMoney(o.pricing.postage) : "Free"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Buyer protection</dt><dd>{formatMoney(o.pricing.buyerFee)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Order total</dt><dd>{formatMoney(o.pricing.total)}</dd></div>
            </dl>
          </section>
        ))}
      </div>

      {/* TODO(stripe): mount the Stripe Payment Element here. Never collect card details in our own inputs. */}
      <section className="card mt-4 p-4" aria-label="Payment">
        <h2 className="flex items-center gap-2 text-h3"><CreditCard className="h-5 w-5" aria-hidden /> Payment</h2>
        <div className="mt-3 rounded-md border border-dashed border-line bg-surface-2 p-4 text-caption text-muted">
          Secure card / Apple Pay / Google Pay form appears here (Stripe). Demo mode — no money is charged.
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-caption text-muted"><Lock className="h-3.5 w-3.5" aria-hidden /> Payments are processed by Stripe. Kindo never sees your card number.</p>
      </section>

      <Notice tone="info" className="mt-4" icon={<ShieldCheck className="h-4 w-4" />} title="Buyer protection">
        {anyPost && <span className="block">{PAYOUT_RULE_POST}</span>}
        {anyHandover && <span className="mt-1 block">{PAYOUT_RULE_MEETUP}</span>}
        <span className="mt-1 block">{BUYER_FEE_RULE}</span>
      </Notice>

      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] mt-6 space-y-2 border-t border-line bg-bg/95 py-3 backdrop-blur lg:bottom-0">
        <Button size="lg" full loading={paying} onClick={pay}>
          Pay {formatMoney(total)}
        </Button>
        <Button
          variant="ghost"
          full
          onClick={async () => {
            await Promise.all(orders.map((o) => cancelOrder(o.id, "changed_mind")));
            nav(-1);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
