import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BellPlus, SlidersHorizontal, X } from "lucide-react";
import type { AgeGroup, CategoryId, Condition, Gender, ListingQuery } from "@/types/models";
import { useAsync } from "@/hooks/useAsync";
import { searchListings } from "@/services/listings";
import { createSavedSearch } from "@/services/saved";
import { AsyncView, EmptyState, GridSkeleton } from "@/components/ui/states";
import { ListingGrid } from "@/components/listing/ListingCard";
import { Chip } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Drawer, Modal, useToast } from "@/components/ui/overlay";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { SearchBox } from "@/components/layout/AppShell";
import { useAuthGuard } from "@/components/auth/SignIn";
import { AGE_GROUPS, CATEGORIES, CONDITIONS, GENDERS, ageLabel, categoryById, conditionLabel } from "@/config/taxonomy";
import { FEATURES, FREE_SHIPPING_THRESHOLD, MAX_PICKUP_DISTANCE_KM } from "@/config/business";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

const SORTS: { value: NonNullable<ListingQuery["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "nearest", label: "Nearest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const RADII = [5, 10, 20, 50, 100];

function parse(sp: URLSearchParams): ListingQuery {
  const list = <T,>(k: string) => (sp.get(k)?.split(",").filter(Boolean) as T[]) ?? undefined;
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);
  return {
    q: sp.get("q") ?? undefined,
    category: (sp.get("category") as CategoryId) ?? undefined,
    ageGroups: list<AgeGroup>("age"),
    conditions: list<Condition>("cond"),
    gender: (sp.get("gender") as Gender) ?? undefined,
    minPrice: num("min"),
    maxPrice: num("max"),
    radiusKm: num("radius"),
    delivery: (sp.get("delivery") as ListingQuery["delivery"]) ?? undefined,
    freeShipping: sp.get("free") === "1" || undefined,
    sort: (sp.get("sort") as ListingQuery["sort"]) ?? "newest",
  };
}

function serialise(q: ListingQuery): URLSearchParams {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  if (q.category) sp.set("category", q.category);
  if (q.ageGroups?.length) sp.set("age", q.ageGroups.join(","));
  if (q.conditions?.length) sp.set("cond", q.conditions.join(","));
  if (q.gender) sp.set("gender", q.gender);
  if (q.minPrice != null) sp.set("min", String(q.minPrice));
  if (q.maxPrice != null) sp.set("max", String(q.maxPrice));
  if (q.radiusKm != null) sp.set("radius", String(q.radiusKm));
  if (q.delivery) sp.set("delivery", q.delivery);
  if (q.freeShipping) sp.set("free", "1");
  if (q.sort && q.sort !== "newest") sp.set("sort", q.sort);
  return sp;
}

function describe(q: ListingQuery): string {
  const parts = [
    q.q && `“${q.q}”`,
    q.category && categoryById(q.category).label,
    q.maxPrice != null && `under ${formatMoney(q.maxPrice, { whole: true })}`,
    q.radiusKm != null && `within ${q.radiusKm} km`,
    q.ageGroups?.length && q.ageGroups.map(ageLabel).join(", "),
  ].filter(Boolean);
  return parts.join(" · ") || "All listings";
}

export default function Browse() {
  const [sp, setSp] = useSearchParams();
  const query = useMemo(() => parse(sp), [sp]);
  const update = (patch: Partial<ListingQuery>) => setSp(serialise({ ...query, ...patch }), { replace: true });
  const results = useAsync(() => searchListings(query), [sp.toString()], ["listings"]);
  const [drawer, setDrawer] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  const active: { key: string; label: string; clear: Partial<ListingQuery> }[] = [
    query.q && { key: "q", label: `“${query.q}”`, clear: { q: undefined } },
    ...(query.ageGroups ?? []).map((a) => ({ key: `age-${a}`, label: ageLabel(a), clear: { ageGroups: query.ageGroups!.filter((x) => x !== a) } })),
    ...(query.conditions ?? []).map((c) => ({ key: `c-${c}`, label: conditionLabel(c), clear: { conditions: query.conditions!.filter((x) => x !== c) } })),
    query.gender && { key: "g", label: GENDERS.find((g) => g.id === query.gender)!.label, clear: { gender: undefined } },
    (query.minPrice != null || query.maxPrice != null) && {
      key: "price",
      label: `${query.minPrice != null ? formatMoney(query.minPrice, { whole: true }) : "$0"} – ${query.maxPrice != null ? formatMoney(query.maxPrice, { whole: true }) : "any"}`,
      clear: { minPrice: undefined, maxPrice: undefined },
    },
    query.radiusKm != null && { key: "r", label: `Within ${query.radiusKm} km`, clear: { radiusKm: undefined } },
    query.delivery && { key: "d", label: query.delivery === "post" ? "Can be posted" : `Pickup within ${MAX_PICKUP_DISTANCE_KM} km`, clear: { delivery: undefined } },
    query.freeShipping && { key: "f", label: "Free post", clear: { freeShipping: undefined } },
  ].filter(Boolean) as { key: string; label: string; clear: Partial<ListingQuery> }[];

  const filterCount = active.filter((a) => a.key !== "q").length;

  return (
    <div className="page">
      <SearchBox className="mb-4 lg:hidden" />
      <h1 className="sr-only">Browse listings</h1>

      {/* Category chips */}
      <div className="scroll-row" aria-label="Categories">
        <Chip active={!query.category} onClick={() => update({ category: undefined })} icon={<CategoryIcon id="all" size={18} />}>
          All
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={query.category === c.id} onClick={() => update({ category: query.category === c.id ? undefined : c.id })} icon={<CategoryIcon id={c.id} size={18} />}>
            {c.short}
          </Chip>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="secondary" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setDrawer(true)} aria-label={`Filters${filterCount ? ` (${filterCount} active)` : ""}`}>
          Filters
          {filterCount > 0 && <span className="rounded-full bg-ink px-1.5 text-caption text-on-ink">{filterCount}</span>}
        </Button>
        <Chip active={!!query.freeShipping} onClick={() => update({ freeShipping: query.freeShipping ? undefined : true })}>
          Free post
        </Chip>
        <Chip active={query.delivery === "pickup"} onClick={() => update({ delivery: query.delivery === "pickup" ? undefined : "pickup" })}>
          Pickup nearby
        </Chip>
        <label className="ml-auto flex items-center gap-2 text-caption text-muted">
          <span className="hidden sm:inline">Sort</span>
          <select
            value={query.sort}
            onChange={(e) => update({ sort: e.target.value as ListingQuery["sort"] })}
            className="min-h-tap rounded-full border border-line bg-surface px-3 text-body text-ink"
            aria-label="Sort results"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Active filters */}
      {active.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {active.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => update(a.clear)}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-lilac-soft px-3 text-caption font-medium text-lilac"
              aria-label={`Remove filter ${a.label}`}
            >
              {a.label} <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ))}
          <button type="button" className="min-h-[36px] px-2 text-caption font-semibold text-ink underline" onClick={() => setSp(new URLSearchParams(), { replace: true })}>
            Clear all
          </button>
        </div>
      )}

      <div className="mb-3 mt-5 flex items-center justify-between gap-3">
        <p className="text-caption text-muted" aria-live="polite">
          {results.loading ? "Searching…" : results.data ? `${results.data.length} ${results.data.length === 1 ? "result" : "results"}` : ""}
        </p>
        {FEATURES.savedSearches && (
          <Button variant="ghost" size="sm" icon={<BellPlus className="h-4 w-4" />} onClick={() => setSaveOpen(true)}>
            Save search
          </Button>
        )}
      </div>

      <AsyncView
        state={results}
        skeleton={<GridSkeleton count={8} />}
        empty={
          <EmptyState
            illustration="search"
            title="No matches yet"
            body="Try removing a filter, or save this search and we'll tell you when something's listed."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {active.length > 0 && (
                  <Button variant="secondary" onClick={() => setSp(new URLSearchParams(), { replace: true })}>
                    Clear filters
                  </Button>
                )}
                {FEATURES.savedSearches && (
                  <Button icon={<BellPlus className="h-4 w-4" />} onClick={() => setSaveOpen(true)}>
                    Notify me
                  </Button>
                )}
              </div>
            }
          />
        }
      >
        {(list) => <ListingGrid listings={list} />}
      </AsyncView>

      <FilterDrawer open={drawer} onClose={() => setDrawer(false)} query={query} onApply={(q) => setSp(serialise(q), { replace: true })} resultCount={results.data?.length} />
      <SaveSearchModal open={saveOpen} onClose={() => setSaveOpen(false)} query={query} />
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line py-4 first:pt-0 last:border-0">
      <legend className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function FilterDrawer({ open, onClose, query, onApply, resultCount }: { open: boolean; onClose: () => void; query: ListingQuery; onApply: (q: ListingQuery) => void; resultCount?: number }) {
  // Filters apply instantly; the drawer is just a container.
  const toggle = <T,>(arr: T[] | undefined, v: T) => (arr?.includes(v) ? arr.filter((x) => x !== v) : [...(arr ?? []), v]);
  const set = (patch: Partial<ListingQuery>) => onApply({ ...query, ...patch });
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onApply({ q: query.q, category: query.category, sort: query.sort })}>
            Clear all
          </Button>
          <Button full onClick={onClose}>
            Show {resultCount ?? ""} results
          </Button>
        </div>
      }
    >
      <FilterGroup title="Age">
        {AGE_GROUPS.filter((a) => a.id !== "all").map((a) => (
          <Chip key={a.id} active={query.ageGroups?.includes(a.id)} onClick={() => set({ ageGroups: toggle(query.ageGroups, a.id) })}>
            {a.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Condition">
        {CONDITIONS.map((c) => (
          <Chip key={c.id} active={query.conditions?.includes(c.id)} onClick={() => set({ conditions: toggle(query.conditions, c.id) })}>
            {c.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="For">
        {GENDERS.map((g) => (
          <Chip key={g.id} active={query.gender === g.id} onClick={() => set({ gender: query.gender === g.id ? undefined : g.id })}>
            {g.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        <div className="flex w-full items-center gap-2">
          <input
            className="input"
            inputMode="numeric"
            placeholder="Min $"
            aria-label="Minimum price"
            value={query.minPrice ?? ""}
            onChange={(e) => set({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
          <span className="text-muted">–</span>
          <input
            className="input"
            inputMode="numeric"
            placeholder="Max $"
            aria-label="Maximum price"
            value={query.maxPrice ?? ""}
            onChange={(e) => set({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </FilterGroup>
      <FilterGroup title="Distance">
        {RADII.map((r) => (
          <Chip key={r} active={query.radiusKm === r} onClick={() => set({ radiusKm: query.radiusKm === r ? undefined : r })}>
            {r} km
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Delivery">
        <Chip active={query.delivery === "post"} onClick={() => set({ delivery: query.delivery === "post" ? undefined : "post" })}>
          Can be posted
        </Chip>
        <Chip active={query.delivery === "pickup"} onClick={() => set({ delivery: query.delivery === "pickup" ? undefined : "pickup" })}>
          Pickup or meetup (within {MAX_PICKUP_DISTANCE_KM} km)
        </Chip>
        <Chip active={!!query.freeShipping} onClick={() => set({ freeShipping: query.freeShipping ? undefined : true })}>
          Free post ({formatMoney(FREE_SHIPPING_THRESHOLD, { whole: true })}+)
        </Chip>
      </FilterGroup>
    </Drawer>
  );
}

function SaveSearchModal({ open, onClose, query }: { open: boolean; onClose: () => void; query: ListingQuery }) {
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const guard = useAuthGuard();
  const { sort: _sort, ...rest } = query;
  const suggested = describe(query);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Save this search"
      footer={
        <Button
          full
          loading={busy}
          onClick={() =>
            guard("Sign in to get alerts for new listings", async () => {
              setBusy(true);
              try {
                await createSavedSearch(label.trim() || suggested, rest, true);
                toast("Alert saved — we'll let you know");
                onClose();
              } catch (e) {
                toast((e as Error).message, "error");
              } finally {
                setBusy(false);
              }
            })
          }
        >
          Notify me about new matches
        </Button>
      }
    >
      <p className="text-body text-muted">We'll notify you when something new is listed that matches:</p>
      <p className={cn("mt-2 rounded-md bg-surface-2 p-3 font-medium")}>{suggested}</p>
      <label className="label mt-4" htmlFor="ss-label">
        Name (optional)
      </label>
      <input id="ss-label" className="input" value={label} placeholder={suggested} onChange={(e) => setLabel(e.target.value)} />
      <p className="mt-3 text-caption text-muted">Manage alerts any time in Profile → Alerts.</p>
    </Modal>
  );
}
