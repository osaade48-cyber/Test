import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Baby, Crown, Flame, Sparkles, Users } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useAsync } from "@/hooks/useAsync";
import { clearRecentlyViewed, getByCategories, getFeed, getRecentlyViewed, searchListings, type FeedTab } from "@/services/listings";
import { getChildren } from "@/services/children";
import { ListingGrid, ListingRow } from "@/components/listing/ListingCard";
import { CategoryTile } from "@/components/icons/CategoryIcon";
import { CardSkeleton, EmptyState, ErrorState, GridSkeleton } from "@/components/ui/states";
import { Segmented, SectionHeader } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/Button";
import { CATEGORIES, NEXT_STAGE, ageLabel } from "@/config/taxonomy";
import { FEATURES, PRO_FREE_BOOSTS } from "@/config/business";
import { currentAgeGroup, nextAgeGroup, outgrownAgeGroups } from "@/lib/children";
import { formatChildAge } from "@/lib/format";
import type { Child } from "@/types/models";

function RowSkeleton() {
  return (
    <div className="scroll-row">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="w-[190px] shrink-0 md:w-[220px]">
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
}

function FeedSection() {
  const [tab, setTab] = useState<FeedTab>("for_you");
  const feed = useAsync(() => getFeed(tab), [tab], ["listings"]);
  return (
    <section className="mt-6" aria-label="Your feed">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Segmented
          label="Feed"
          value={tab}
          onChange={setTab}
          options={[
            { value: "for_you", label: <><Sparkles className="h-4 w-4" aria-hidden /> For you</> },
            { value: "trending", label: <><Flame className="h-4 w-4" aria-hidden /> Trending</> },
            { value: "following", label: <><Users className="h-4 w-4" aria-hidden /> Following</> },
          ]}
        />
        <Link to="/browse" className="link hidden min-h-tap items-center gap-1 sm:inline-flex">
          See all <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      {feed.error ? (
        <ErrorState error={feed.error} onRetry={feed.reload} />
      ) : feed.loading || !feed.data ? (
        <RowSkeleton />
      ) : feed.data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-6 text-center text-body text-muted">
          {tab === "following" ? "Sellers you buy from will show up here." : "Nothing here yet — check back soon."}
        </p>
      ) : (
        <ListingRow listings={feed.data} />
      )}
    </section>
  );
}

function ChildRows({ child }: { child: Child }) {
  const next = nextAgeGroup(child);
  const stage = NEXT_STAGE[next];
  const outgrown = outgrownAgeGroups(child);
  const row = useAsync(() => getByCategories(stage?.categories ?? [], [next, currentAgeGroup(child)]), [child.id], ["listings"]);
  return (
    <>
      <section className="mt-8">
        <SectionHeader
          title={`Coming up next for ${child.nickname}`}
          action={<span className="text-caption text-muted">{formatChildAge(child.birthDate, child.dueDate)} · {ageLabel(next)}</span>}
        />
        {stage && <p className="-mt-2 mb-3 text-caption text-muted">Think {stage.blurb}.</p>}
        {row.data ? row.data.length ? <ListingRow listings={row.data} /> : <p className="text-body text-muted">No matches right now.</p> : <RowSkeleton />}
      </section>
      {outgrown.length > 0 && (
        <Link
          to={`/sell?age=${outgrown[outgrown.length - 1]}`}
          className="mt-6 flex items-center gap-4 rounded-lg border border-line bg-surface p-4 transition hover:shadow-card"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-sky-soft text-sky">
            <Baby className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Ready to sell what {child.nickname} has outgrown?</span>
            <span className="block text-caption text-muted">{ageLabel(outgrown[outgrown.length - 1])} clothes and gear sell fastest while they're in season.</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        </Link>
      )}
    </>
  );
}

export default function Home() {
  const { user } = useSession();
  const children = useAsync(getChildren, [], ["children"]);
  const recent = useAsync(getRecentlyViewed, [], ["listings"]);
  const fresh = useAsync(() => searchListings({ sort: "newest", limit: 12 }), [], ["listings"]);

  return (
    <div className="page">
      <h1 className="text-h1">Hi {user?.name.split(" ")[0]} 👋</h1>
      <p className="text-body text-muted">What are you looking for today?</p>

      <div className="scroll-row mt-4" role="list" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <Link role="listitem" key={c.id} to={`/browse?category=${c.id}`} className="flex w-[84px] shrink-0 snap-start flex-col items-center gap-1.5 text-center">
            <CategoryTile id={c.id} className="h-14 w-14 rounded-lg" size={24} />
            <span className="text-caption font-medium leading-tight">{c.short}</span>
          </Link>
        ))}
      </div>

      <FeedSection />

      {FEATURES.childProfiles &&
        (children.data?.length ? (
          children.data.map((c) => <ChildRows key={c.id} child={c} />)
        ) : children.data ? (
          <Link to="/profile/little-ones" className="mt-8 flex items-center gap-4 rounded-lg border border-dashed border-line p-4 hover:bg-surface">
            <Baby className="h-6 w-6 shrink-0 text-brand" aria-hidden />
            <span className="flex-1 text-body">
              <strong>Add your little one</strong> — get suggestions for their next stage. Optional, only you can see it.
            </span>
            <ArrowRight className="h-5 w-5 text-muted" aria-hidden />
          </Link>
        ) : null)}

      {recent.data && recent.data.length > 0 && (
        <section className="mt-8">
          <SectionHeader
            title="Recently viewed"
            action={
              <button type="button" className="min-h-tap text-caption font-medium text-muted hover:text-ink" onClick={() => clearRecentlyViewed().then(recent.reload)}>
                Clear
              </button>
            }
          />
          <ListingRow listings={recent.data} compact />
        </section>
      )}

      {!user?.isPro && (
        <Link to="/pro" className="bg-brand-gradient mt-8 flex flex-col gap-3 rounded-xl p-5 text-white sm:flex-row sm:items-center sm:justify-between md:p-6">
          <span>
            <span className="flex items-center gap-2 text-micro font-semibold uppercase">
              <Crown className="h-4 w-4" aria-hidden /> Kindo Pro
            </span>
            <span className="mt-1 block font-serif text-h2">Sell faster with free boosts</span>
            <span className="block text-caption opacity-90">{PRO_FREE_BOOSTS} free boosts a month · Pro seller badge · priority placement</span>
          </span>
          <span className="inline-flex min-h-tap items-center gap-1 self-start rounded-full bg-white/20 px-4 font-medium sm:self-auto">
            Learn more <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </Link>
      )}

      <section className="mt-8">
        <SectionHeader title="Fresh finds" count={fresh.data?.length} action={<ButtonLink to="/browse" variant="ghost" size="sm">See all</ButtonLink>} />
        {fresh.error ? (
          <ErrorState error={fresh.error} onRetry={fresh.reload} />
        ) : !fresh.data ? (
          <GridSkeleton count={8} />
        ) : fresh.data.length ? (
          <ListingGrid listings={fresh.data} />
        ) : (
          <EmptyState illustration="tag" title="No listings yet" body="Be the first — list something your little one has outgrown." action={<ButtonLink to="/sell" variant="brand">List an item</ButtonLink>} />
        )}
      </section>
    </div>
  );
}
