import { Link, useNavigate } from "react-router-dom";
import { Info, MapPin, Package, Trash2, Truck, Users } from "lucide-react";
import type { DeliveryMethod, SellerBundle } from "@/types/models";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { getCart, removeFromCart, setDeliveryMethod } from "@/services/cart";
import { checkoutPath } from "@/services/checkout";
import { AsyncView, EmptyState, RowSkeleton } from "@/components/ui/states";
import { Avatar, Notice } from "@/components/ui/primitives";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/overlay";
import { ListingImage } from "@/components/listing/ListingImage";
import { METHOD_LABEL, round2, totalLabel } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { SHIPPING_RULE } from "@/config/copy";
import { cn } from "@/lib/cn";

const ICON: Record<DeliveryMethod, typeof Truck> = { post: Truck, large_calculated: Package, pickup: MapPin, meetup: Users };

export default function Cart() {
  return (
    <RequireAuth title="Sign in to see your bundle">
      <CartInner />
    </RequireAuth>
  );
}

function CartInner() {
  const state = useAsync(getCart, [], ["cart", "listings"]);
  const nav = useNavigate();
  // Nothing is created until the buyer pays on the checkout page.
  const checkout = (sellerIds?: string[]) => nav(checkoutPath({ kind: "cart", sellerIds }));

  return (
    <div className="page max-w-3xl">
      <h1 className="text-h1">Your bundle</h1>
      <p className="text-caption text-muted">Items are grouped by seller — one postage charge per seller.</p>
      <div className="mt-4">
        <AsyncView
          state={state}
          skeleton={<RowSkeleton count={3} />}
          empty={
            <EmptyState
              illustration="bag"
              title="Your bundle is empty"
              body="Add a few things from the same seller and save on postage."
              action={<ButtonLink to="/browse">Browse listings</ButtonLink>}
            />
          }
        >
          {(bundles) => {
            const grand = round2(bundles.reduce((s, b) => s + b.pricing.total, 0));
            const unknown = bundles.some((b) => b.pricing.postage == null);
            return (
              <>
                <div className="space-y-4">
                  {bundles.map((b) => (
                    <BundleCard key={b.seller.id} bundle={b} onCheckout={() => checkout([b.seller.id])} />
                  ))}
                </div>
                <div className="card mt-6 p-4">
                  <div className="flex items-center justify-between text-h3">
                    <span>Total for {bundles.length} seller{bundles.length > 1 ? "s" : ""}</span>
                    <span>{unknown ? `${formatMoney(grand)} + shipping` : formatMoney(grand)}</span>
                  </div>
                  <p className="mt-1 text-caption text-muted">Includes postage and buyer protection. Each seller is a separate order.</p>
                  <Button className="mt-4" size="lg" full onClick={() => checkout()}>
                    Check out all — {unknown ? `${formatMoney(grand)} + shipping` : formatMoney(grand)}
                  </Button>
                </div>
                <p className="mt-4 flex gap-2 text-caption text-muted">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {SHIPPING_RULE}
                </p>
              </>
            );
          }}
        </AsyncView>
      </div>
    </div>
  );
}

function BundleCard({ bundle: b, onCheckout }: { bundle: SellerBundle; onCheckout: () => void }) {
  const toast = useToast();
  const first = b.seller.name.split(" ")[0];
  return (
    <section className="card overflow-hidden" aria-label={`Items from ${first}`}>
      <header className="flex items-center gap-3 border-b border-line p-4">
        <Avatar name={b.seller.name} color={b.seller.avatarColor} size={36} />
        <div className="min-w-0 flex-1">
          <Link to={`/u/${b.seller.id}`} className="font-semibold hover:underline">{first}</Link>
          <p className="text-caption text-muted">{b.seller.location.suburb}, {b.seller.location.state}</p>
        </div>
        <Link to={`/u/${b.seller.id}`} className="link inline-flex min-h-tap items-center text-caption">
          More from {first}
        </Link>
      </header>

      {b.method === "post" && b.pricing.freeShippingGap != null && (
        <Notice tone="lilac" className="m-4 mb-0" icon={<Truck className="h-4 w-4" />}>
          Add <strong>{formatMoney(b.pricing.freeShippingGap)}</strong> more from {first} for free shipping.
        </Notice>
      )}
      {b.pricing.freeShipping && (
        <Notice tone="success" className="m-4 mb-0" icon={<Truck className="h-4 w-4" />}>
          You've unlocked free postage from {first}.
        </Notice>
      )}

      <ul className="divide-y divide-line">
        {b.listings.map((l) => (
          <li key={l.id} className="flex items-center gap-3 p-4">
            <Link to={`/listing/${l.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-2">
              <ListingImage photo={l.photos[0]} iconSize={28} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/listing/${l.id}`} className="line-clamp-2 font-medium">{l.title}</Link>
              <p className="text-body">
                {formatMoney(l.effectivePrice)}
                {l.effectivePrice < l.price && <span className="ml-2 text-caption text-success">Offer accepted</span>}
              </p>
            </div>
            <IconButton
              label={`Remove ${l.title}`}
              onClick={async () => {
                await removeFromCart(l.id);
                toast("Removed from bundle");
              }}
            >
              <Trash2 className="h-5 w-5" />
            </IconButton>
          </li>
        ))}
      </ul>

      <div className="border-t border-line p-4">
        <p className="label">Delivery</p>
        {b.availableMethods.length === 0 ? (
          <Notice tone="warn">These items don't share a delivery method. Check out separately or remove one.</Notice>
        ) : (
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Delivery from ${first}`}>
            {b.availableMethods.map((m) => {
              const Icon = ICON[m];
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={b.method === m}
                  onClick={() => setDeliveryMethod(b.seller.id, m)}
                  className={cn("inline-flex min-h-tap items-center gap-2 rounded-full border px-4 text-body", b.method === m ? "border-ink bg-ink text-on-ink" : "border-line bg-surface")}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {m === "pickup" ? `Pickup in ${b.seller.location.suburb}` : METHOD_LABEL[m]}
                </button>
              );
            })}
          </div>
        )}

        <dl className="mt-4 space-y-1 text-body">
          <div className="flex justify-between"><dt className="text-muted">Items</dt><dd>{formatMoney(b.pricing.itemSubtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{b.pricing.postageLabel}</dt><dd>{b.pricing.postage == null ? "At checkout" : b.pricing.postage === 0 ? "Free" : formatMoney(b.pricing.postage)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Buyer protection</dt><dd>{formatMoney(b.pricing.buyerFee)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Subtotal</dt><dd>{totalLabel(b.pricing)}</dd></div>
        </dl>
        <Button className="mt-3" variant="secondary" full disabled={!b.availableMethods.length} onClick={onCheckout}>
          Check out {first}'s items only
        </Button>
      </div>
    </section>
  );
}
