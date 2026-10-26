import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Info,
  Layers,
  MapPin,
  MessageCircle,
  Package,
  Share2,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";
import type { DeliveryMethod } from "@/types/models";
import { useAsync, useTopicValue } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { getListing, recordView, searchListings } from "@/services/listings";
import { addToCart, inCartSync } from "@/services/cart";
import { checkoutPath } from "@/services/checkout";
import { getAcceptedOfferPrice, makeOffer, openConversation } from "@/services/messages";
import { reportListing } from "@/services/admin";
import { ListingImage } from "@/components/listing/ListingImage";
import { HeartButton, LocationLine, PriceLine, RecallBadge, SafetyBadge, TrustBadge, sellerFirstName } from "@/components/listing/bits";
import { ListingRow } from "@/components/listing/ListingCard";
import { ShareSheet } from "@/components/listing/ShareSheet";
import { Avatar, Badge, Notice, Skeleton, Stars } from "@/components/ui/primitives";
import { Button, IconButton } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/states";
import { Modal, useToast } from "@/components/ui/overlay";
import { useAuthGuard } from "@/components/auth/SignIn";
import { ageLabel, categoryById, conditionLabel, CONDITIONS } from "@/config/taxonomy";
import { FEATURES, OFFER_EXPIRY_HOURS } from "@/config/business";
import { PAYOUT_RULE_MEETUP, PAYOUT_RULE_POST } from "@/config/copy";
import { availableMethods, defaultMethod, haversineKm, isLargeItem, isTooFarForPickup, METHOD_LABEL, priceOrder, totalLabel } from "@/lib/pricing";
import { formatDate, formatMoney, formatRelative } from "@/lib/format";
import { isExpired } from "@/lib/safety";
import { cn } from "@/lib/cn";

const METHOD_ICON: Record<DeliveryMethod, typeof Truck> = { post: Truck, large_calculated: Package, pickup: MapPin, meetup: Users };

function ListingSkeleton() {
  return (
    <div className="page grid gap-6 lg:grid-cols-[1.2fr_1fr]" aria-busy="true" aria-label="Loading listing">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default function ListingPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { user } = useSession();
  const toast = useToast();
  const guard = useAuthGuard();
  const state = useAsync(() => getListing(id), [id, user?.id], ["listings"]);
  const offerPrice = useAsync(() => getAcceptedOfferPrice(id), [id, user?.id], ["messages"]);
  const inCart = useTopicValue(["cart"], () => inCartSync(id));
  const [photoIdx, setPhotoIdx] = useState(0);
  const [method, setMethod] = useState<DeliveryMethod | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState<"buy" | "bundle" | "chat" | null>(null);

  useEffect(() => {
    recordView(id);
    setPhotoIdx(0);
    setMethod(null);
  }, [id]);

  const l = state.data;
  const methods = useMemo(() => (l ? availableMethods([l]) : []), [l]);
  const chosen = method && methods.includes(method) ? method : defaultMethod(methods, l && user ? haversineKm(user.location, l.location) : null);
  const price = offerPrice.data ?? l?.price ?? 0;
  const distanceKm = l && user ? haversineKm(user.location, l.location) : undefined;
  const pricing = l && chosen ? priceOrder([{ ...l, effectivePrice: price }], chosen, { distanceKm, sellerSuburb: l.location.suburb }) : null;

  const similar = useAsync(() => (l ? searchListings({ category: l.category, limit: 8 }) : Promise.resolve([])), [l?.category], []);

  if (state.error) return <div className="page"><ErrorState error={state.error} onRetry={state.reload} /></div>;
  if (!l) return <ListingSkeleton />;

  const isOwn = user?.id === l.sellerId;
  const blocked = l.recallStatus === "recall_notice";
  const unavailable = l.status !== "active";
  const expired = l.category === "car-seats" && isExpired(l.safety?.expiryDate);
  const canBuy = !isOwn && !blocked && !unavailable && !!chosen;
  const photo = l.photos[photoIdx];

  const buyNow = () =>
    guard("Sign in to buy this item", async () => {
      if (!chosen) return;
      setBusy("buy");
      try {
        nav(checkoutPath({ kind: "buy_now", listingId: l.id, method: chosen, offerPrice: offerPrice.data ?? undefined }));
      } catch (e) {
        toast((e as Error).message, "error");
      } finally {
        setBusy(null);
      }
    });

  const addBundle = () =>
    guard("Sign in to start a bundle", async () => {
      setBusy("bundle");
      try {
        await addToCart(l.id, offerPrice.data ?? undefined);
        toast(`Added to your bundle from ${sellerFirstName(l.seller)}`);
      } catch (e) {
        toast((e as Error).message, "error");
      } finally {
        setBusy(null);
      }
    });

  const message = () =>
    guard("Sign in to message the seller", async () => {
      setBusy("chat");
      try {
        nav(`/messages/${await openConversation(l.id)}`);
      } catch (e) {
        toast((e as Error).message, "error");
      } finally {
        setBusy(null);
      }
    });

  return (
    <div className="page pb-36 lg:pb-8">
      <button type="button" onClick={() => (history.length > 1 ? nav(-1) : nav("/browse"))} className="mb-3 inline-flex min-h-tap items-center gap-1 text-body text-muted hover:text-ink">
        <ArrowLeft className="h-5 w-5" aria-hidden /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        {/* Gallery — the only share/save buttons on the page */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
            <ListingImage photo={photo} iconSize={120} />
            <div className="absolute right-3 top-3 flex gap-2">
              {FEATURES.shareListing && (
                <IconButton label="Share listing" variant="overlay" onClick={() => setShareOpen(true)}>
                  <Share2 className="h-5 w-5" />
                </IconButton>
              )}
              <HeartButton listingId={l.id} />
            </div>
            {l.photos.length > 1 && (
              <>
                <IconButton label="Previous photo" variant="overlay" className="absolute left-3 top-1/2 -translate-y-1/2" onClick={() => setPhotoIdx((i) => (i - 1 + l.photos.length) % l.photos.length)}>
                  <ChevronLeft className="h-5 w-5" />
                </IconButton>
                <IconButton label="Next photo" variant="overlay" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setPhotoIdx((i) => (i + 1) % l.photos.length)}>
                  <ChevronRight className="h-5 w-5" />
                </IconButton>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-2.5 py-0.5 text-caption text-on-ink">
                  {photoIdx + 1} / {l.photos.length}
                </span>
              </>
            )}
          </div>
          {l.photos.length > 1 && (
            <div className="mt-3 hidden gap-2 md:flex">
              {l.photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === photoIdx}
                  onClick={() => setPhotoIdx(i)}
                  className={cn("h-16 w-16 overflow-hidden rounded-md border-2", i === photoIdx ? "border-ink" : "border-transparent")}
                >
                  <ListingImage photo={p} iconSize={24} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Key info — above the fold */}
        <div className="min-w-0">
          <p className="text-micro font-semibold uppercase text-muted">
            {l.brand} · {categoryById(l.category).label}
          </p>
          <h1 className="mt-1 text-h1">{l.title}</h1>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <PriceLine listing={{ price, originalPrice: offerPrice.data ? l.price : l.originalPrice }} className="text-[1.75rem]" />
            {offerPrice.data && <Badge tone="success">Your accepted offer</Badge>}
          </div>
          <LocationLine listing={l} distanceKm={distanceKm} className="mt-2 text-body" />

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{conditionLabel(l.condition)}</Badge>
            <Badge>{l.size ? `Size ${l.size}` : ageLabel(l.ageGroup)}</Badge>
            {l.size && <Badge>{ageLabel(l.ageGroup)}</Badge>}
            {l.isBundle && l.bundleItemCount && <Badge tone="lilac" icon={<Layers className="h-3.5 w-3.5" aria-hidden />}>Bundle · {l.bundleItemCount} items</Badge>}
            {isLargeItem(l) && <Badge tone="info" icon={<Package className="h-3.5 w-3.5" aria-hidden />}>Large item</Badge>}
          </div>

          {blocked && (
            <Notice tone="danger" className="mt-4" icon={<AlertTriangle className="h-4 w-4" />} title="Recall notice — do not buy">
              This product matches an active recall notice. Buying is disabled. See <Link to="/prohibited-items" className="link">prohibited &amp; recalled items</Link>.
            </Notice>
          )}
          {expired && (
            <Notice tone="warn" className="mt-4" icon={<AlertTriangle className="h-4 w-4" />} title={`This car seat expired ${formatDate(l.safety!.expiryDate!)}`}>
              Expired car seats aren't safe to use. Kindo recommends you don't buy it.
            </Notice>
          )}

          {/* How you get it */}
          {!isOwn && !unavailable && (
            <fieldset className="mt-5">
              <legend className="mb-2 text-caption font-semibold text-ink">How you get it</legend>
              <div className="grid gap-2">
                {methods.map((m) => {
                  const p = priceOrder([{ ...l, effectivePrice: price }], m, { distanceKm, sellerSuburb: l.location.suburb });
                  const Icon = METHOD_ICON[m];
                  return (
                    <label
                      key={m}
                      className={cn(
                        "flex min-h-tap cursor-pointer items-center gap-3 rounded-md border p-3 transition",
                        chosen === m ? "border-ink bg-surface shadow-card" : "border-line bg-surface hover:bg-surface-2",
                      )}
                    >
                      <input type="radio" name="method" className="sr-only" checked={chosen === m} onChange={() => setMethod(m)} />
                      <Icon className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          {m === "pickup" ? `Pickup in ${l.location.suburb}` : METHOD_LABEL[m]}
                        </span>
                        <span className="block text-caption text-muted">{m === "pickup" || m === "meetup" ? (isTooFarForPickup(distanceKm) ? `No postage · ${Math.round(distanceKm!)} km away` : "No postage · QR code handover") : p.postageLabel}</span>
                      </span>
                      {chosen === m && <Check className="h-5 w-5 text-ink" aria-hidden />}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Honest total */}
          {pricing && !isOwn && !unavailable && (
            <dl className="mt-4 space-y-1.5 rounded-md bg-surface-2 p-4 text-body">
              <div className="flex justify-between">
                <dt className="text-muted">Item</dt>
                <dd>{formatMoney(pricing.itemSubtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Postage</dt>
                <dd>{pricing.postage == null ? "Calculated at checkout" : pricing.postage === 0 ? (pricing.freeShipping ? "Free" : "None") : formatMoney(pricing.postage)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">
                  <Link to="/buyer-protection" className="underline decoration-dotted underline-offset-2">Buyer protection</Link>
                </dt>
                <dd>{formatMoney(pricing.buyerFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{totalLabel(pricing)}</dd>
              </div>
            </dl>
          )}

          {/* Desktop actions */}
          <div className="mt-4 hidden flex-col gap-2 lg:flex">
            {isOwn ? (
              <div className="flex gap-2">
                <Button full variant="secondary" onClick={() => nav(`/sell/${l.id}`)}>Edit listing</Button>
                <Button full variant="secondary" onClick={() => nav("/my-listings")}>My listings</Button>
              </div>
            ) : unavailable ? (
              <Notice tone="neutral" title={l.status === "reserved" ? "Reserved" : "Sold"}>This item is no longer available.</Notice>
            ) : (
              <>
                <Button size="lg" full disabled={!canBuy} loading={busy === "buy"} onClick={buyNow}>
                  Buy now{pricing ? ` — ${totalLabel(pricing)}` : ""}
                </Button>
                <div className="flex gap-2">
                  <Button full variant="secondary" disabled={!canBuy || !!offerPrice.data} onClick={() => guard("Sign in to make an offer", () => setOfferOpen(true))}>
                    Make offer
                  </Button>
                  {FEATURES.bundleCart && (
                    <Button full variant="secondary" disabled={!canBuy || inCart} loading={busy === "bundle"} icon={<ShoppingBag className="h-4 w-4" />} onClick={addBundle}>
                      {inCart ? "In bundle" : "Add to bundle"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {!isOwn && (
            <p className="mt-3 flex gap-2 text-caption text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {chosen === "pickup" || chosen === "meetup" ? PAYOUT_RULE_MEETUP : PAYOUT_RULE_POST}
            </p>
          )}

          {/* Safety */}
          {(l.safety?.completed || FEATURES.recallCheck) && (
            <section className="mt-6 space-y-3 rounded-lg border border-line p-4" aria-label="Safety">
              <div className="flex flex-wrap gap-2">
                <RecallBadge status={l.recallStatus} />
              </div>
              {l.safety?.completed && (
                <>
                  <SafetyBadge />
                  <ul className="space-y-1 text-caption">
                    {l.safety.answers.map((a) => (
                      <li key={a.questionId} className="flex gap-2">
                        {a.answer ? <Check className="h-4 w-4 shrink-0 text-success" aria-label="Yes" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-warn" aria-label="No" />}
                        {a.question}
                      </li>
                    ))}
                  </ul>
                  {l.safety.manufactureDate && (
                    <p className="text-caption">
                      Manufactured {formatDate(l.safety.manufactureDate)} · <strong className={cn(expired && "text-danger")}>{expired ? "Expired" : "Expires"} {formatDate(l.safety.expiryDate!)}</strong>
                    </p>
                  )}
                </>
              )}
            </section>
          )}

          {/* Description */}
          <section className="mt-6">
            <h2 className="text-h3">Description</h2>
            <p className="mt-2 whitespace-pre-line text-body">{l.description || "No description."}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-caption">
              <div><dt className="text-muted">Condition</dt><dd className="font-medium">{conditionLabel(l.condition)} — {CONDITIONS.find((c) => c.id === l.condition)?.hint}</dd></div>
              <div><dt className="text-muted">Age</dt><dd className="font-medium">{ageLabel(l.ageGroup)}</dd></div>
              {l.model && <div><dt className="text-muted">Model</dt><dd className="font-medium">{l.model}</dd></div>}
              <div><dt className="text-muted">Listed</dt><dd className="font-medium">{formatRelative(l.createdAt)}</dd></div>
            </dl>
          </section>

          {/* Seller */}
          <section className="mt-6 rounded-lg border border-line p-4" aria-label="Seller">
            <Link to={`/u/${l.seller.id}`} className="flex items-center gap-3">
              <Avatar name={l.seller.name} color={l.seller.avatarColor} size={48} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold">
                  {l.seller.name.split(" ")[0]} <TrustBadge tier={l.seller.trustTier} />
                </span>
                <span className="flex flex-wrap items-center gap-x-2 text-caption text-muted">
                  {l.seller.rating != null ? (
                    <>
                      <Stars rating={l.seller.rating} size={12} /> {l.seller.rating.toFixed(1)} ({l.seller.reviewCount})
                    </>
                  ) : (
                    "No reviews yet"
                  )}
                  <span>· {l.seller.completedSales} sales</span>
                  {l.seller.responseTimeHours != null && (
                    <span className="inline-flex items-center gap-1">
                      · <Clock className="h-3 w-3" aria-hidden /> replies in ~{l.seller.responseTimeHours} h
                    </span>
                  )}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
            </Link>
            {!isOwn && (
              <Button className="mt-3" full variant="secondary" icon={<MessageCircle className="h-4 w-4" />} loading={busy === "chat"} onClick={message}>
                Message {sellerFirstName(l.seller)}
              </Button>
            )}
          </section>

          {!isOwn && (
            <button type="button" onClick={() => guard("Sign in to report a listing", () => setReportOpen(true))} className="mt-4 inline-flex min-h-tap items-center gap-1.5 text-caption text-muted hover:text-ink">
              <Flag className="h-4 w-4" aria-hidden /> Report this listing
            </button>
          )}
        </div>
      </div>

      {similar.data && similar.data.filter((s) => s.id !== l.id).length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-h2">More {categoryById(l.category).label.toLowerCase()}</h2>
          <ListingRow listings={similar.data.filter((s) => s.id !== l.id)} />
        </section>
      )}

      {/* Mobile sticky bar with the honest total */}
      {!isOwn && !unavailable && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-caption text-muted">Total incl. {chosen === "pickup" || chosen === "meetup" ? "protection" : "postage & protection"}</p>
              <p className="truncate font-semibold">{pricing ? totalLabel(pricing) : "—"}</p>
            </div>
            {FEATURES.bundleCart && (
              <IconButton label={inCart ? "In your bundle" : "Add to bundle"} variant="surface" disabled={!canBuy || inCart} onClick={addBundle}>
                {inCart ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
              </IconButton>
            )}
            <Button variant="secondary" disabled={!canBuy || !!offerPrice.data} onClick={() => guard("Sign in to make an offer", () => setOfferOpen(true))}>
              Offer
            </Button>
            <Button disabled={!canBuy} loading={busy === "buy"} onClick={buyNow}>
              Buy now
            </Button>
          </div>
        </div>
      )}

      <OfferModal open={offerOpen} onClose={() => setOfferOpen(false)} listingId={l.id} price={l.price} sellerName={sellerFirstName(l.seller)} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} listing={l} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} listingId={l.id} />
    </div>
  );
}

function OfferModal({ open, onClose, listingId, price, sellerName }: { open: boolean; onClose: () => void; listingId: string; price: number; sellerName: string }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const nav = useNavigate();
  const value = Number(amount);
  const suggestions = [0.9, 0.85, 0.8].map((f) => Math.floor(price * f));
  const valid = value > 0 && value < price;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Make an offer"
      footer={
        <Button
          full
          disabled={!valid}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const { conversationId } = await makeOffer(listingId, value);
              toast("Offer sent");
              onClose();
              nav(`/messages/${conversationId}`);
            } catch (e) {
              toast((e as Error).message, "error");
            } finally {
              setBusy(false);
            }
          }}
        >
          Send offer{valid ? ` of ${formatMoney(value)}` : ""}
        </Button>
      }
    >
      <p className="text-body text-muted">Asking price {formatMoney(price)}. {sellerName} can accept, decline or counter.</p>
      <label htmlFor="offer" className="label mt-4">Your offer</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">$</span>
        <input id="offer" className="input pl-7 text-h3" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
      </div>
      {amount && !valid && <p className="mt-1 text-caption text-danger">Offers must be under the asking price.</p>}
      <div className="mt-3 flex gap-2">
        {suggestions.map((s) => (
          <button key={s} type="button" className="min-h-tap flex-1 rounded-md border border-line text-body font-medium hover:bg-surface-2" onClick={() => setAmount(String(s))}>
            {formatMoney(s, { whole: true })}
          </button>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-caption text-muted">
        <Clock className="h-3.5 w-3.5" aria-hidden /> Offers expire in {OFFER_EXPIRY_HOURS}h. If accepted, you go straight to checkout.
      </p>
    </Modal>
  );
}

const REPORT_REASONS = [
  { id: "recalled_item", label: "Recalled or expired item" },
  { id: "prohibited_item", label: "Prohibited item" },
  { id: "misleading", label: "Misleading photos or description" },
  { id: "scam", label: "Looks like a scam" },
  { id: "offensive", label: "Offensive content" },
  { id: "other", label: "Something else" },
] as const;

function ReportModal({ open, onClose, listingId }: { open: boolean; onClose: () => void; listingId: string }) {
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]["id"]>("recalled_item");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report this listing"
      footer={
        <Button
          full
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await reportListing(listingId, reason, details);
              toast("Thanks — our team will review it");
              onClose();
            } catch (e) {
              toast((e as Error).message, "error");
            } finally {
              setBusy(false);
            }
          }}
        >
          Send report
        </Button>
      }
    >
      <div className="space-y-2">
        {REPORT_REASONS.map((r) => (
          <label key={r.id} className="flex min-h-tap cursor-pointer items-center gap-3 rounded-md border border-line px-3">
            <input type="radio" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} className="h-4 w-4 accent-[rgb(var(--c-ink))]" />
            {r.label}
          </label>
        ))}
      </div>
      <label htmlFor="report-details" className="label mt-4">Details (optional)</label>
      <textarea id="report-details" className="input min-h-[96px] py-2" value={details} onChange={(e) => setDetails(e.target.value)} />
    </Modal>
  );
}
