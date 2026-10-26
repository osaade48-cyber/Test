import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { getCheckoutQuote, placeOrder, specFromParams } from "@/services/checkout";
import { ErrorState, RowSkeleton, EmptyState } from "@/components/ui/states";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/overlay";
import { ListingImage } from "@/components/listing/ListingImage";
import { METHOD_LABEL, round2, totalLabel } from "@/lib/pricing";
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
  const spec = specFromParams(sp);
  const nav = useNavigate();
  const toast = useToast();
  const [paying, setPaying] = useState(false);
  const state = useAsync(() => getCheckoutQuote(spec), [sp.toString()]);

  if (state.error) return <div className="page"><ErrorState error={state.error} onRetry={state.reload} /></div>;
  if (!state.data) return <div className="page max-w-2xl"><RowSkeleton count={2} /></div>;

  const bundles = state.data;
  if (!bundles.length) {
    return (
      <div className="page">
        <EmptyState illustration="bag" title="Nothing to pay for" body="Your bundle is empty, or these items have sold." action={<ButtonLink to="/browse">Browse listings</ButtonLink>} />
      </div>
    );
  }

  const total = round2(bundles.reduce((s, b) => s + b.pricing.total, 0));
  const unknown = bundles.some((b) => b.pricing.postage == null);
  const anyHandover = bundles.some((b) => isHandoverMethod(b.method));
  const anyPost = bundles.some((b) => !isHandoverMethod(b.method));

  const pay = async () => {
    setPaying(true);
    try {
      const res = await placeOrder(spec); // TODO(stripe): confirm PaymentIntent
      toast("Payment held securely");
      nav(res.orderIds.length === 1 ? `/orders/${res.orderIds[0]}` : "/orders", { replace: true });
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
        {bundles.map((b) => (
          <section key={b.seller.id} className="card p-4" aria-label={`Items from ${b.seller.name}`}>
            <p className="text-caption text-muted">
              From {b.seller.name.split(" ")[0]} · {b.method === "pickup" ? `Pickup in ${b.seller.location.suburb}` : METHOD_LABEL[b.method]}
            </p>
            <ul className="mt-2 space-y-2">
              {b.listings.map((l) => (
                <li key={l.id} className="flex items-center gap-3">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    <ListingImage photo={l.photos[0]} iconSize={24} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  <span>{formatMoney(l.effectivePrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-body">
              <div className="flex justify-between"><dt className="text-muted">Items</dt><dd>{formatMoney(b.pricing.itemSubtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-muted">{b.pricing.postageLabel}</dt>
                <dd>{b.pricing.postage == null ? "Quoted at payment" : b.pricing.postage ? formatMoney(b.pricing.postage) : "Free"}</dd>
              </div>
              <div className="flex justify-between"><dt className="text-muted">Buyer protection</dt><dd>{formatMoney(b.pricing.buyerFee)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Order total</dt><dd>{totalLabel(b.pricing)}</dd></div>
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

      <div className="sticky bottom-0 mt-6 space-y-2 border-t border-line bg-bg/95 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
        <Button size="lg" full loading={paying} onClick={pay}>
          Pay {unknown ? `${formatMoney(total)} + shipping` : formatMoney(total)}
        </Button>
        <Button variant="ghost" full onClick={() => nav(-1)}>
          Back
        </Button>
      </div>
    </div>
  );
}
