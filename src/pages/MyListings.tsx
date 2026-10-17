import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, ArrowLeft, Eye, Heart, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Tag, Zap } from "lucide-react";
import type { Listing, ListingStatus } from "@/types/models";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { boostListing, getMyListings, setListingStatus, updatePrice } from "@/services/listings";
import { getSubscription } from "@/services/payments";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Badge, Segmented, Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/ui/states";
import { Modal, useToast } from "@/components/ui/overlay";
import { ListingImage } from "@/components/listing/ListingImage";
import { conditionLabel } from "@/config/taxonomy";
import { BOOST_DURATION_DAYS, BOOST_PRICE } from "@/config/business";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "active" | "sold_reserved" | "archived";

export default function MyListings() {
  return (
    <RequireAuth title="Sign in to manage your listings">
      <MyListingsInner />
    </RequireAuth>
  );
}

function MyListingsInner() {
  const nav = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("active");
  const [q, setQ] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [menuFor, setMenuFor] = useState<Listing | null>(null);
  const [priceFor, setPriceFor] = useState<Listing | null>(null);
  const state = useAsync(() => getMyListings(tab), [tab], ["listings"]);
  const sub = useAsync(getSubscription, [], ["subscription"]);

  const list = (state.data?.listings ?? []).filter((l) => !q || l.title.toLowerCase().includes(q.toLowerCase()));
  const stats = state.data?.stats;

  const bulk = async (status: ListingStatus) => {
    await setListingStatus(selected, status);
    toast(`${selected.length} listing${selected.length === 1 ? "" : "s"} ${status === "archived" ? "archived" : "relisted"}`);
    setSelected([]);
    setSelecting(false);
  };

  return (
    <div className="page">
      <div className="flex items-center gap-3">
        <IconButton label="Back" variant="surface" onClick={() => nav(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <div className="min-w-0 flex-1">
          <h1 className="text-h1">My listings</h1>
          <p className="text-caption text-muted">{stats ? `${stats.listed} active` : " "}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setSelecting(!selecting); setSelected([]); }}>
          {selecting ? "Done" : "Select"}
        </Button>
        <ButtonLink to="/sell" variant="brand" size="sm" icon={<Plus className="h-4 w-4" />}>
          New
        </ButtonLink>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Listed", value: stats?.listed },
          { label: "Views", value: stats?.views },
          { label: "Saves", value: stats?.saves },
          { label: "Boosted", value: stats?.boosted },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <dd className="text-h2 font-sans">{s.value ?? <Skeleton className="mx-auto h-6 w-10" />}</dd>
            <dt className="text-caption text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented
          label="Listing status"
          value={tab}
          onChange={(t) => { setTab(t); setSelected([]); }}
          className="w-full sm:w-auto"
          options={[
            { value: "active", label: "Active" },
            { value: "sold_reserved", label: "Sold" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input rounded-full pl-10" placeholder="Search your listings" aria-label="Search your listings" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        {state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : state.loading ? (
          <RowSkeleton />
        ) : list.length === 0 ? (
          <EmptyState
            illustration="tag"
            title={q ? "No listings match" : tab === "active" ? "Nothing listed yet" : tab === "sold_reserved" ? "No sales yet" : "Nothing archived"}
            body={tab === "active" && !q ? "List something your little one has outgrown — it takes a couple of minutes." : undefined}
            action={tab === "active" && !q ? <ButtonLink to="/sell" variant="brand">List an item</ButtonLink> : undefined}
          />
        ) : (
          <ul className="space-y-3">
            {list.map((l) => {
              const isSel = selected.includes(l.id);
              const boosted = l.boostedUntil && new Date(l.boostedUntil) > new Date();
              return (
                <li key={l.id} className={cn("card flex items-center gap-3 p-3", isSel && "ring-2 ring-ink")}>
                  {selecting && (
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-[rgb(var(--c-ink))]"
                      checked={isSel}
                      aria-label={`Select ${l.title}`}
                      onChange={() => setSelected((s) => (isSel ? s.filter((x) => x !== l.id) : [...s, l.id]))}
                    />
                  )}
                  <Link to={`/listing/${l.id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    <ListingImage photo={l.photos[0]} iconSize={32} />
                  </Link>
                  <Link to={`/listing/${l.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.title}</p>
                    <p className="font-semibold">{formatMoney(l.price, { whole: true })}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden />{l.views}</span>
                      <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" aria-hidden />{l.saves}</span>
                      <span>{conditionLabel(l.condition)}</span>
                      {boosted && <Badge tone="lilac" icon={<Zap className="h-3 w-3" aria-hidden />}>Boosted to {formatDate(l.boostedUntil!)}</Badge>}
                      {l.status === "reserved" && <Badge tone="info">Reserved · awaiting handover</Badge>}
                    </p>
                  </Link>
                  {!selecting && (
                    <IconButton label={`Actions for ${l.title}`} variant="surface" onClick={() => setMenuFor(l)}>
                      <MoreHorizontal className="h-5 w-5" />
                    </IconButton>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selecting && selected.length > 0 && (
        <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] mt-4 flex gap-2 rounded-lg bg-ink p-3 text-on-ink shadow-pop lg:bottom-4">
          <span className="flex-1 self-center text-body">{selected.length} selected</span>
          {tab === "archived" ? (
            <Button variant="secondary" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={() => bulk("active")}>Relist</Button>
          ) : tab === "active" ? (
            <Button variant="secondary" size="sm" icon={<Archive className="h-4 w-4" />} onClick={() => bulk("archived")}>Archive</Button>
          ) : null}
        </div>
      )}

      <Modal open={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor?.title ?? ""}>
        {menuFor && (
          <div className="flex flex-col gap-1">
            {menuFor.status === "active" && (
              <>
                <MenuItem icon={<Pencil className="h-5 w-5" />} label="Edit listing" onClick={() => nav(`/sell/${menuFor.id}`)} />
                <MenuItem icon={<Tag className="h-5 w-5" />} label="Reduce price" hint="People who saved it get a price-drop alert" onClick={() => { setPriceFor(menuFor); setMenuFor(null); }} />
                <MenuItem
                  icon={<Zap className="h-5 w-5" />}
                  label="Boost listing"
                  hint={`Top of search for ${BOOST_DURATION_DAYS} days · ${(sub.data?.boostsRemaining ?? 0) > 0 ? `${sub.data!.boostsRemaining} free Pro boosts left` : formatMoney(BOOST_PRICE)}`}
                  onClick={async () => {
                    await boostListing(menuFor.id); // TODO(stripe): charge BOOST_PRICE when no credits
                    toast("Boosted");
                    setMenuFor(null);
                  }}
                />
                <MenuItem icon={<Archive className="h-5 w-5" />} label="Archive" onClick={async () => { await setListingStatus([menuFor.id], "archived"); toast("Archived"); setMenuFor(null); }} />
              </>
            )}
            {(menuFor.status === "archived" || menuFor.status === "sold") && (
              <MenuItem icon={<RotateCcw className="h-5 w-5" />} label={menuFor.status === "sold" ? "Sell one like this" : "Relist"} onClick={async () => {
                if (menuFor.status === "sold") nav(`/sell?from=${menuFor.id}`);
                else { await setListingStatus([menuFor.id], "active"); toast("Relisted"); setMenuFor(null); }
              }} />
            )}
            {menuFor.status === "reserved" && <MenuItem icon={<Eye className="h-5 w-5" />} label="View order" onClick={() => nav("/orders?tab=sales")} />}
          </div>
        )}
      </Modal>
      <PriceModal listing={priceFor} onClose={() => setPriceFor(null)} />
    </div>
  );
}

function MenuItem({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[52px] items-center gap-3 rounded-md px-2 text-left hover:bg-surface-2">
      <span className="text-muted">{icon}</span>
      <span>
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-caption text-muted">{hint}</span>}
      </span>
    </button>
  );
}

function PriceModal({ listing, onClose }: { listing: Listing | null; onClose: () => void }) {
  const [value, setValue] = useState("");
  const toast = useToast();
  const n = Number(value);
  return (
    <Modal
      open={!!listing}
      onClose={onClose}
      title="Reduce price"
      footer={
        <Button
          full
          disabled={!listing || !(n > 0 && n < listing.price)}
          onClick={async () => {
            await updatePrice(listing!.id, n);
            toast("Price updated");
            setValue("");
            onClose();
          }}
        >
          Update price
        </Button>
      }
    >
      <p className="text-body text-muted">Currently {listing && formatMoney(listing.price)}.</p>
      <label className="label mt-3" htmlFor="newprice">New price</label>
      <input id="newprice" className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))} />
    </Modal>
  );
}
