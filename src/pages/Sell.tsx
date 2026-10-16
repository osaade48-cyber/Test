import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Camera, Check, ImagePlus, Info, Layers, Lightbulb, MapPin, Package, Trash2, Truck, Users } from "lucide-react";
import type { AgeGroup, CategoryId, ListingDraft, ListingPhoto, SatchelSize } from "@/types/models";
import { useSession } from "@/hooks/useSession";
import { RequireAuth } from "@/components/auth/SignIn";
import { discardDraft, draftFromListing, editDraftFor, getDraft, publishListing, saveDraft } from "@/services/listings";
import { Button } from "@/components/ui/Button";
import { Badge, Chip, Field, Notice, Skeleton, Toggle } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/overlay";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { ListingImage } from "@/components/listing/ListingImage";
import { AGE_GROUPS, CATEGORIES, CLOTHING_SIZES, CONDITIONS, GENDERS, SAFETY_CHECKLISTS } from "@/config/taxonomy";
import { CAR_SEAT_LIFESPAN_YEARS, FEATURES, MAX_LISTING_PHOTOS, MAX_TITLE_LENGTH, MIN_LISTING_PHOTOS, SATCHELS } from "@/config/business";
import { BUYER_FEE_RULE, NO_FEES_LINE, PAYOUT_RULE_MEETUP, PAYOUT_RULE_POST, SELLER_SHIPPING_NOTE } from "@/config/copy";
import { listingWarnings, validateForPublish, type ValidationIssue } from "@/lib/listingValidation";
import { buyerFee, isLargeItem, satchelLabel } from "@/lib/pricing";
import { carSeatExpiry, isExpired } from "@/lib/safety";
import { formatDate, formatMoney } from "@/lib/format";
import { uid } from "@/lib/id";
import { cn } from "@/lib/cn";

const STEPS = ["Photos", "Details", "Price & delivery"] as const;

/** Downscale an image file to keep drafts small. TODO(api): upload to object storage instead. */
async function fileToPhoto(file: File): Promise<ListingPhoto> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const max = 720;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { id: uid("p"), url: canvas.toDataURL("image/jpeg", 0.75), alt: file.name.replace(/\.[^.]+$/, "") };
}

export default function Sell() {
  return (
    <RequireAuth title="Sign in to start selling" body={`${NO_FEES_LINE} List in a couple of minutes.`}>
      <SellFlow />
    </RequireAuth>
  );
}

function SellFlow() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useSession();
  const draftKey = id ? `edit:${id}` : "new";
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const loaded = useRef(false);

  // Load: existing draft → edit → "sell one like this" → blank
  useEffect(() => {
    (async () => {
      let d = await getDraft(draftKey);
      if (!d && id) d = await editDraftFor(id);
      const from = sp.get("from");
      if (!d && from) d = await draftFromListing(from);
      if (!d) d = { photos: [], delivery: { pickup: true, meetup: false }, step: 1, ageGroup: (sp.get("age") as AgeGroup) || undefined };
      setDraft(d);
      setStep(d.step ?? 1);
      loaded.current = true;
    })().catch((e) => toast((e as Error).message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Autosave (debounced)
  useEffect(() => {
    if (!loaded.current || !draft) return;
    const t = setTimeout(() => {
      saveDraft({ ...draft, step }, draftKey).then(() => setSavedAt(new Date()));
    }, 500);
    return () => clearTimeout(t);
  }, [draft, step, draftKey]);

  const issues = useMemo(() => (draft ? validateForPublish(draft) : []), [draft]);
  const warnings = useMemo(() => (draft ? listingWarnings(draft) : []), [draft]);
  const issuesFor = (s: number) => issues.filter((i) => i.step === s);
  const err = (field: string) => (showErrors ? issues.find((i) => i.field === field)?.message : undefined);

  if (!draft) {
    return (
      <div className="page max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const patch = (p: Partial<ListingDraft>) => setDraft((d) => ({ ...d!, ...p }));
  const large = draft.category ? isLargeItem({ category: draft.category, isLargeItem: !!draft.isLargeItem }) : !!draft.isLargeItem;

  const next = () => {
    if (issuesFor(step).length) {
      setShowErrors(true);
      toast(issuesFor(step)[0].message, "error");
      return;
    }
    setShowErrors(false);
    setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3);
    window.scrollTo(0, 0);
  };

  const publish = async () => {
    if (issues.length) {
      setShowErrors(true);
      setStep(issues[0].step);
      toast(issues[0].message, "error");
      return;
    }
    setPublishing(true);
    try {
      const l = await publishListing(draft, draftKey);
      toast(id ? "Listing updated" : "Your listing is live");
      nav(`/listing/${l.id}`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="page max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => (step > 1 ? setStep((s) => (s - 1) as 1 | 2) : nav(-1))} className="inline-flex min-h-tap items-center gap-1 text-muted hover:text-ink">
          <ArrowLeft className="h-5 w-5" aria-hidden /> {step > 1 ? STEPS[step - 2] : "Back"}
        </button>
        <span className="text-caption text-muted" aria-live="polite">
          {savedAt ? `Draft saved ${savedAt.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}` : "Drafts save automatically"}
        </span>
      </div>

      <h1 className="text-h1">{id ? "Edit listing" : "List an item"}</h1>

      {/* Progress */}
      <ol className="mt-4 flex items-center gap-2 text-caption" aria-label="Progress">
        {STEPS.map((s, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const done = n < step;
          return (
            <li key={s} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => n < step && setStep(n)}
                aria-current={n === step ? "step" : undefined}
                className={cn("flex min-h-tap items-center gap-2 font-medium", n === step ? "text-ink" : done ? "text-ink/80" : "text-muted")}
              >
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption", n === step ? "bg-ink text-on-ink" : done ? "bg-success-soft text-success" : "bg-surface-2")}>
                  {done ? <Check className="h-4 w-4" aria-hidden /> : n}
                </span>
                <span className={cn(n !== step && "hidden sm:inline")}>{s}</span>
              </button>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden />}
            </li>
          );
        })}
      </ol>
      <p className="mt-1 text-caption text-muted">{STEPS.join(" → ")}</p>

      <div className="mt-6">
        {step === 1 && <PhotosStep draft={draft} patch={patch} error={err("photos")} />}
        {step === 2 && <DetailsStep draft={draft} patch={patch} err={err} warnings={warnings} />}
        {step === 3 && <PriceStep draft={draft} patch={patch} err={err} large={large} sellerSuburb={user?.location.suburb ?? ""} />}
      </div>

      {showErrors && issues.length > 0 && step === 3 && <IssueList issues={issues} onGo={(s) => setStep(s)} />}

      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 mt-8 flex gap-2 border-t border-line bg-bg/95 py-3 backdrop-blur lg:bottom-0">
        {draftKey === "new" && (
          <Button
            variant="ghost"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={async () => {
              await discardDraft(draftKey);
              setDraft({ photos: [], delivery: { pickup: true, meetup: false } });
              setStep(1);
              toast("Draft discarded");
            }}
          >
            <span className="hidden sm:inline">Discard</span>
          </Button>
        )}
        {step < 3 ? (
          <Button full size="lg" onClick={next}>
            Continue to {STEPS[step as 1 | 2]}
          </Button>
        ) : (
          <Button full size="lg" variant="brand" loading={publishing} onClick={publish}>
            {id ? "Save changes" : "Publish listing"}
          </Button>
        )}
      </div>
    </div>
  );
}

function IssueList({ issues, onGo }: { issues: ValidationIssue[]; onGo: (s: 1 | 2 | 3) => void }) {
  return (
    <Notice tone="warn" className="mt-6" icon={<AlertTriangle className="h-4 w-4" />} title="Before you can publish:">
      <ul className="mt-1 space-y-1">
        {issues.map((i) => (
          <li key={i.field + i.message}>
            <button type="button" className="underline" onClick={() => onGo(i.step)}>
              {i.message}
            </button>
          </li>
        ))}
      </ul>
    </Notice>
  );
}

// ─── Step 1: Photos ────────────────────────────────────────────────────────

function PhotosStep({ draft, patch, error }: { draft: ListingDraft; patch: (p: Partial<ListingDraft>) => void; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const photos = draft.photos ?? [];
  const add = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_LISTING_PHOTOS - photos.length;
    try {
      const added = await Promise.all([...files].slice(0, room).map(fileToPhoto));
      patch({ photos: [...photos, ...added] });
    } catch {
      toast("Couldn't read that photo. Try a JPG or PNG.", "error");
    }
  };
  return (
    <section aria-labelledby="photos-h">
      <h2 id="photos-h" className="text-h2">Add photos</h2>
      <p className="mt-1 text-body text-muted">
        At least {MIN_LISTING_PHOTOS}, up to {MAX_LISTING_PHOTOS}. The first photo is the cover.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p, i) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-md bg-surface-2">
            <ListingImage photo={p} iconSize={32} />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 text-micro font-semibold text-on-ink">Cover</span>}
            <button
              type="button"
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => patch({ photos: photos.filter((x) => x.id !== p.id) })}
              className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 shadow-card"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
        {photos.length < MAX_LISTING_PHOTOS && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className={cn("flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-caption font-medium", error ? "border-danger text-danger" : "border-line text-muted hover:bg-surface")}
          >
            <ImagePlus className="h-6 w-6" aria-hidden />
            Add photo
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple capture="environment" className="sr-only" onChange={(e) => add(e.target.files)} aria-label="Upload photos" />
      {error && <p className="mt-2 text-caption text-danger">{error}</p>}
      <p className="mt-2 text-caption text-muted">{photos.length}/{MIN_LISTING_PHOTOS} minimum</p>

      <div className="mt-5 rounded-lg bg-sky-soft p-4">
        <p className="flex items-center gap-2 font-semibold text-sky">
          <Lightbulb className="h-4 w-4" aria-hidden /> Photo tips
        </p>
        <ul className="mt-2 space-y-1 text-caption text-ink/80">
          <li className="flex gap-2"><Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Take real photos in daylight — no stock images.</li>
          <li className="flex gap-2"><Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Show any marks, stains or wear up close.</li>
          <li className="flex gap-2"><Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />For prams, cots and car seats, photograph the compliance label.</li>
          <li className="flex gap-2"><Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />For clothing, include the size tag.</li>
        </ul>
      </div>
    </section>
  );
}

// ─── Step 2: Details ───────────────────────────────────────────────────────

function DetailsStep({ draft, patch, err, warnings }: { draft: ListingDraft; patch: (p: Partial<ListingDraft>) => void; err: (f: string) => string | undefined; warnings: string[] }) {
  const checklist = draft.category ? SAFETY_CHECKLISTS[draft.category] : undefined;
  const setCategory = (c: CategoryId) => {
    const large = isLargeItem({ category: c, isLargeItem: !!draft.isLargeItem });
    const delivery = { ...(draft.delivery ?? { pickup: true, meetup: false }) };
    if (large) {
      delete delivery.post; // large items can't use satchels
      delivery.pickup = true;
    }
    patch({ category: c, delivery, safety: c === draft.category ? draft.safety : undefined, size: c === "clothing" ? draft.size : undefined });
  };

  return (
    <section className="space-y-5" aria-labelledby="details-h">
      <h2 id="details-h" className="text-h2">Details</h2>
      <Field label="Title" htmlFor="title" error={err("title")} hint={`${draft.title?.length ?? 0}/${MAX_TITLE_LENGTH} · e.g. “UPPAbaby Vista V2 pram with bassinet — grey”`}>
        <input id="title" className="input" maxLength={MAX_TITLE_LENGTH} value={draft.title ?? ""} onChange={(e) => patch({ title: e.target.value })} />
      </Field>

      <div>
        <p className="label">Category</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={draft.category === c.id}
              onClick={() => setCategory(c.id)}
              className={cn("flex min-h-tap items-center gap-2 rounded-md border px-3 py-2 text-left text-body", draft.category === c.id ? "border-ink bg-surface shadow-card" : "border-line bg-surface hover:bg-surface-2")}
            >
              <CategoryIcon id={c.id} size={18} className="text-brand" />
              {c.short}
            </button>
          ))}
        </div>
        {err("category") && <p className="mt-1 text-caption text-danger">{err("category")}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand" htmlFor="brand">
          <input id="brand" className="input" value={draft.brand ?? ""} onChange={(e) => patch({ brand: e.target.value })} placeholder="e.g. Bugaboo" />
        </Field>
        <Field label="Model (optional)" htmlFor="model">
          <input id="model" className="input" value={draft.model ?? ""} onChange={(e) => patch({ model: e.target.value })} placeholder="e.g. Fox 3" />
        </Field>
      </div>

      <div>
        <p className="label">Condition</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={draft.condition === c.id}
              onClick={() => patch({ condition: c.id })}
              className={cn("min-h-tap rounded-md border px-3 py-2 text-left", draft.condition === c.id ? "border-ink bg-surface shadow-card" : "border-line bg-surface hover:bg-surface-2")}
            >
              <span className="block font-medium">{c.label}</span>
              <span className="block text-caption text-muted">{c.hint}</span>
            </button>
          ))}
        </div>
        {err("condition") && <p className="mt-1 text-caption text-danger">{err("condition")}</p>}
      </div>

      <div>
        <p className="label">Age group</p>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((a) => (
            <Chip key={a.id} active={draft.ageGroup === a.id} onClick={() => patch({ ageGroup: a.id })}>
              {a.label}
            </Chip>
          ))}
        </div>
        {err("ageGroup") && <p className="mt-1 text-caption text-danger">{err("ageGroup")}</p>}
      </div>

      {draft.category === "clothing" && (
        <>
          <div>
            <p className="label">Size (AU)</p>
            <div className="flex flex-wrap gap-2">
              {CLOTHING_SIZES.map((s) => (
                <Chip key={s} active={draft.size === s} onClick={() => patch({ size: s })} className="min-w-[56px] justify-center">
                  {s}
                </Chip>
              ))}
            </div>
            {err("size") && <p className="mt-1 text-caption text-danger">{err("size")}</p>}
          </div>
          <div>
            <p className="label">For</p>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <Chip key={g.id} active={draft.gender === g.id} onClick={() => patch({ gender: g.id })}>
                  {g.label}
                </Chip>
              ))}
            </div>
          </div>
        </>
      )}

      {FEATURES.bundleListings && (
        <div className="rounded-md border border-line p-3">
          <Toggle
            checked={!!draft.isBundle}
            onChange={(v) => patch({ isBundle: v, bundleItemCount: v ? draft.bundleItemCount ?? 2 : undefined })}
            label="This is a bundle"
            description="One listing for a set, e.g. “Size 00 girls winter bundle — 12 items”"
          />
          {draft.isBundle && (
            <div className="mt-2 flex items-center gap-3">
              <Layers className="h-5 w-5 text-muted" aria-hidden />
              <label htmlFor="count" className="text-body">Number of items</label>
              <input
                id="count"
                className="input w-24"
                inputMode="numeric"
                value={draft.bundleItemCount ?? ""}
                onChange={(e) => patch({ bundleItemCount: Number(e.target.value.replace(/\D/g, "")) || undefined })}
              />
            </div>
          )}
        </div>
      )}

      {draft.category && !isLargeItem({ category: draft.category, isLargeItem: false }) && (
        <div className="rounded-md border border-line p-3">
          <Toggle
            checked={!!draft.isLargeItem}
            onChange={(v) => {
              const delivery = { ...(draft.delivery ?? { pickup: true, meetup: false }) };
              if (v) delete delivery.post;
              patch({ isLargeItem: v, delivery });
            }}
            label="Large item"
            description="Too big for a satchel — pickup, meetup or calculated shipping only"
          />
        </div>
      )}

      <Field label="Description" htmlFor="desc" hint="Mention age of the item, any marks, what's included, and pet/smoke-free home.">
        <textarea id="desc" className="input min-h-[120px] py-2" value={draft.description ?? ""} onChange={(e) => patch({ description: e.target.value })} />
      </Field>

      {FEATURES.safetyChecklists && checklist && <SafetyChecklist draft={draft} patch={patch} err={err} />}

      {warnings.map((w) => (
        <Notice key={w} tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
          {w}
        </Notice>
      ))}
    </section>
  );
}

function SafetyChecklist({ draft, patch, err }: { draft: ListingDraft; patch: (p: Partial<ListingDraft>) => void; err: (f: string) => string | undefined }) {
  const questions = SAFETY_CHECKLISTS[draft.category!]!;
  const answers = draft.safety?.answers ?? [];
  const answerOf = (id: string) => answers.find((a) => a.questionId === id)?.answer;
  const update = (id: string, question: string, answer: boolean) => {
    const nextAnswers = [...answers.filter((a) => a.questionId !== id), { questionId: id, question, answer }];
    const completed = questions.every((q) => nextAnswers.some((a) => a.questionId === q.id));
    patch({ safety: { ...draft.safety, answers: nextAnswers, completed, completedAt: completed ? new Date().toISOString() : undefined } });
  };
  const expiry = draft.safety?.expiryDate;

  return (
    <fieldset className={cn("rounded-lg border p-4", err("safety") ? "border-danger" : "border-line")}>
      <legend className="px-1 text-h3 font-serif">Safety checklist</legend>
      <p className="text-caption text-muted">Answer honestly — buyers see your answers. This is your declaration; Kindo doesn't inspect items.</p>
      <div className="mt-3 space-y-3">
        {questions.map((q) => {
          const a = answerOf(q.id);
          return (
            <div key={q.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-body">{q.question}</span>
              <div className="flex shrink-0 gap-2" role="group" aria-label={q.question}>
                <Chip active={a === true} onClick={() => update(q.id, q.question, true)}>Yes</Chip>
                <Chip active={a === false} onClick={() => update(q.id, q.question, false)}>No</Chip>
              </div>
            </div>
          );
        })}
      </div>
      {err("safety") && <p className="mt-2 text-caption text-danger">{err("safety")}</p>}

      {draft.category === "car-seats" && (
        <div className="mt-4 border-t border-line pt-4">
          <Field label="Manufacture date" htmlFor="mfd" error={err("manufactureDate")} hint={`Printed on the seat's label. Car seats expire ${CAR_SEAT_LIFESPAN_YEARS} years after manufacture.`}>
            <input
              id="mfd"
              type="month"
              className="input"
              max={new Date().toISOString().slice(0, 7)}
              value={draft.safety?.manufactureDate?.slice(0, 7) ?? ""}
              onChange={(e) => {
                const iso = e.target.value ? new Date(`${e.target.value}-01T00:00:00.000Z`).toISOString() : undefined;
                patch({ safety: { ...(draft.safety ?? { completed: false, answers: [] }), manufactureDate: iso, expiryDate: iso ? carSeatExpiry(iso) : undefined } });
              }}
            />
          </Field>
          {expiry && (
            <p className={cn("mt-2 font-medium", isExpired(expiry) ? "text-danger" : "text-success")}>
              {isExpired(expiry) ? "Expired" : "Expires"} {formatDate(expiry)}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}

// ─── Step 3: Price & delivery ──────────────────────────────────────────────

function PriceStep({ draft, patch, err, large, sellerSuburb }: { draft: ListingDraft; patch: (p: Partial<ListingDraft>) => void; err: (f: string) => string | undefined; large: boolean; sellerSuburb: string }) {
  const d = draft.delivery ?? { pickup: true, meetup: false };
  const setD = (p: Partial<typeof d>) => patch({ delivery: { ...d, ...p } });
  const price = draft.price ?? 0;
  const option = (checked: boolean, onChange: (v: boolean) => void, icon: React.ReactNode, title: string, desc: string) => (
    <label className={cn("flex min-h-tap cursor-pointer items-start gap-3 rounded-md border p-3", checked ? "border-ink bg-surface shadow-card" : "border-line bg-surface")}>
      <input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--c-ink))]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="mt-0.5 text-brand">{icon}</span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-caption text-muted">{desc}</span>
      </span>
    </label>
  );

  return (
    <section className="space-y-6" aria-labelledby="price-h">
      <h2 id="price-h" className="text-h2">Price &amp; delivery</h2>
      <Field label="Price" htmlFor="price" error={err("price")}>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">$</span>
          <input
            id="price"
            className="input pl-7 text-h3"
            inputMode="decimal"
            value={draft.price ?? ""}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d.]/g, "");
              patch({ price: v ? Number(v) : undefined });
            }}
          />
        </div>
      </Field>

      <div>
        <p className="label">How can buyers get it?</p>
        {err("delivery") && <p className="mb-2 text-caption text-danger">{err("delivery")}</p>}
        <div className="space-y-2">
          {large ? (
            <>
              <Notice tone="info" icon={<Package className="h-4 w-4" />}>
                Large items can't go in an AusPost satchel. Offer pickup, meetup, or calculated courier shipping.
              </Notice>
              {option(!!d.largeCalculated, (v) => setD({ largeCalculated: v }), <Package className="h-5 w-5" />, "Large item — calculated shipping", "Buyer gets a courier quote at checkout. Never included in free shipping.")}
            </>
          ) : (
            <div className={cn("rounded-md border p-3", d.post ? "border-ink bg-surface shadow-card" : "border-line bg-surface")}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--c-ink))]" checked={!!d.post} onChange={(e) => setD({ post: e.target.checked ? { satchel: "S" } : undefined })} />
                <Truck className="mt-0.5 h-5 w-5 text-brand" aria-hidden />
                <span>
                  <span className="block font-medium">Post with AusPost</span>
                  <span className="block text-caption text-muted">Buyer pays postage unless their order with you is free-shipping.</span>
                </span>
              </label>
              {d.post && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(Object.keys(SATCHELS) as SatchelSize[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={d.post?.satchel === s}
                      onClick={() => setD({ post: { satchel: s } })}
                      className={cn("min-h-tap rounded-md border px-3 py-2 text-left", d.post?.satchel === s ? "border-ink" : "border-line")}
                    >
                      <span className="block text-body font-medium">{satchelLabel(s)}</span>
                      <span className="block text-caption text-muted">{SATCHELS[s].fits}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {option(d.pickup, (v) => setD({ pickup: v }), <MapPin className="h-5 w-5" />, `Pickup in ${sellerSuburb || "your suburb"}`, "Buyers see your suburb only — never your address. Confirmed with a QR code.")}
          {option(d.meetup, (v) => setD({ meetup: v }), <Users className="h-5 w-5" />, "Meetup", "Meet somewhere public. Confirmed with a QR code.")}
        </div>
        <p className="mt-3 flex gap-2 text-caption text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {SELLER_SHIPPING_NOTE}
        </p>
      </div>

      {/* Fee breakdown */}
      <div className="rounded-lg bg-surface-2 p-4">
        <p className="flex items-center gap-2 font-semibold">
          You receive {formatMoney(price)} <Badge tone="success">{NO_FEES_LINE}</Badge>
        </p>
        <dl className="mt-3 space-y-1 text-caption">
          <div className="flex justify-between"><dt className="text-muted">Your price</dt><dd>{formatMoney(price)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Kindo seller fee</dt><dd>{formatMoney(0)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Buyer protection (paid by buyer)</dt><dd>{formatMoney(buyerFee(price))}</dd></div>
        </dl>
        <p className="mt-3 text-caption text-muted">{BUYER_FEE_RULE}</p>
        <p className="mt-2 text-caption text-muted">
          <strong className="text-ink">When you get paid:</strong> {PAYOUT_RULE_POST} {PAYOUT_RULE_MEETUP}
        </p>
      </div>

      <p className="text-caption text-muted">
        By publishing you confirm this item isn't on our <Link to="/prohibited-items" className="link">prohibited &amp; recalled items</Link> list.
      </p>
    </section>
  );
}
