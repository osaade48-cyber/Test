"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SceneView } from "@/components/three/SceneView";
import type { Focus } from "@/components/three/CameraRig";
import {
  ADDONS,
  ADDON_KEYS,
  COLOURS,
  FLOORS,
  LININGS,
  LOOKS,
  PLAQUE_MAX,
  SIZES,
  addonPrice,
  cleanPlaque,
  configToParams,
  formatAUD,
  priceLines,
  totalPrice,
  type AddonKey,
  type Config,
} from "@/lib/configurator";
import { BRAND } from "@/config/brand";

/** Which camera framing best shows each option when it changes. */
const FOCUS_FOR: Record<string, Focus> = {
  size: "overview",
  colour: "overview",
  look: "overview",
  lining: "interior",
  floor: "interior",
  bed: "interior",
  deck: "front",
  lights: "front",
  planter: "left",
};

export function Configurator({ initial }: { initial: Config }) {
  const [config, setConfig] = useState<Config>(initial);
  const [dusk, setDusk] = useState(false);
  const [doorOpen, setDoorOpen] = useState(true);
  const [focus, setFocus] = useState<Focus>("overview");
  const [focusKey, setFocusKey] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const look = (f: Focus) => {
    setFocus(f);
    setFocusKey((k) => k + 1);
  };

  const update = useCallback(<K extends keyof Config>(key: K, value: Config[K], focusOn?: Focus) => {
    setConfig((c) => ({ ...c, [key]: value }));
    if (focusOn) look(focusOn);
    if (focusOn === "interior") setDoorOpen(true);
  }, []);

  const toggleAddon = (k: AddonKey) => {
    setConfig((c) => ({ ...c, addons: { ...c.addons, [k]: !c.addons[k] } }));
    look(FOCUS_FOR[k]);
    if (k === "bed") setDoorOpen(true);
  };

  // Keep the URL in sync so any moment of the configuration can be shared.
  const query = useMemo(() => configToParams(config).toString(), [config]);
  useEffect(() => {
    const t = setTimeout(() => window.history.replaceState(null, "", `/configure?${query}`), 250);
    return () => clearTimeout(t);
  }, [query]);

  const lines = priceLines(config);
  const total = totalPrice(config);
  const s = SIZES[config.size];
  const title = `${s.label} · ${COLOURS[config.colour].label} · ${LOOKS[config.look].label}`;
  const enquireHref = `/enquire?${query}`;

  const share = async () => {
    const url = `${window.location.origin}/configure?${query}`;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await nav.share({ title: `${BRAND.name} — my dog home`, url });
        return;
      } catch {
        /* cancelled: fall back to copying */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link", url);
    }
    setShareState("copied");
    setTimeout(() => setShareState("idle"), 2400);
  };

  return (
    <div className="pt-16 md:pt-20 lg:grid lg:h-svh lg:grid-cols-[minmax(0,1fr)_440px] lg:overflow-hidden">
      {/* ---------- Stage ---------- */}
      <section
        className="sticky top-16 z-10 h-[48svh] min-h-[300px] md:top-20 lg:relative lg:top-0 lg:h-[calc(100svh-5rem)]"
        aria-label="3D view of your dog home"
        onPointerDown={() => setInteracted(true)}
      >
        <SceneView
          className="h-full w-full"
          config={config}
          dusk={dusk}
          doorOpen={doorOpen}
          mode="configurator"
          focus={focus}
          focusKey={focusKey}
          tone={dusk ? "dark" : "light"}
        />
        <div className={`pointer-events-none absolute inset-x-0 top-0 p-4 md:p-8 transition-colors duration-1000 ${dusk ? "text-paper" : "text-ink"}`}>
          <p className="eyebrow opacity-60">Your home</p>
          <p className="heading mt-1 text-xl md:text-3xl">{title}</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-3 md:p-6">
          <div className="flex flex-wrap gap-2">
            <Segmented
              dark={dusk}
              options={[
                { label: "Day", active: !dusk, onClick: () => setDusk(false) },
                { label: "Dusk", active: dusk, onClick: () => setDusk(true) },
              ]}
            />
            <Pill dark={dusk} onClick={() => { setDoorOpen((o) => !o); look("front"); }}>
              {doorOpen ? "Close door" : "Open door"}
            </Pill>
            <Pill dark={dusk} onClick={() => look("overview")} aria-label="Reset view">
              Reset
            </Pill>
          </div>
          <p
            className={`eyebrow hidden pb-2 transition-opacity duration-1000 sm:block ${interacted ? "opacity-0" : "opacity-60"} ${dusk ? "text-paper" : "text-ink"}`}
          >
            Drag to rotate · Pinch to zoom
          </p>
        </div>
      </section>

      {/* ---------- Options ---------- */}
      <aside className="relative bg-paper lg:flex lg:h-[calc(100svh-5rem)] lg:flex-col lg:border-l lg:border-line">
        <div className="px-5 pt-10 pb-40 md:px-10 lg:flex-1 lg:overflow-y-auto lg:pb-10">
          <header className="mb-12">
            <p className="eyebrow text-muted">Configure</p>
            <h1 className="heading mt-3 text-4xl">Your home, considered.</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A deliberately short list of choices. Every home shares the same architecture, charcoal roof and dark timber-look details.
            </p>
          </header>

          <Group n="01" label="Size">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(SIZES) as (keyof typeof SIZES)[]).map((k) => {
                const v = SIZES[k];
                return (
                  <Choice key={k} active={config.size === k} onClick={() => update("size", k, "overview")}>
                    <span className="heading block text-2xl">{v.label}</span>
                    <span className="mt-1 block text-xs text-muted">{v.dogs}</span>
                    <span className="mt-3 block text-[0.7rem] tracking-wide text-muted">
                      Inside {v.W.toFixed(2)} × {v.D.toFixed(2)} × {v.H.toFixed(2)} m
                    </span>
                    <span className="mt-3 block text-sm">from {formatAUD(v.base)}</span>
                  </Choice>
                );
              })}
            </div>
          </Group>

          <Group n="02" label="Panel colour" value={`${COLOURS[config.colour].label} · Colorbond ${COLOURS[config.colour].colorbond}`}>
            <div className="flex gap-5">
              {(Object.keys(COLOURS) as (keyof typeof COLOURS)[]).map((k) => {
                const v = COLOURS[k];
                const active = config.colour === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => update("colour", k, "overview")}
                    aria-pressed={active}
                    aria-label={`${v.label}, Colorbond ${v.colorbond}`}
                    className="group flex flex-col items-center gap-3"
                  >
                    <span
                      className={`block h-14 w-14 rounded-full transition-[box-shadow] duration-700 ease-[var(--ease-lux)] ${
                        active ? "shadow-[0_0_0_1px_var(--color-paper),0_0_0_2px_var(--color-ink)]" : "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] group-hover:shadow-[0_0_0_1px_var(--color-paper),0_0_0_2px_var(--color-stone)]"
                      }`}
                      style={{ background: v.hex }}
                    />
                    <span className={`text-xs transition-colors ${active ? "text-ink" : "text-muted"}`}>{v.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted">Roof and trim are always charcoal. Colours on screen are approximate.</p>
          </Group>

          <Group n="03" label="Panel look">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(LOOKS) as (keyof typeof LOOKS)[]).map((k) => (
                <Choice key={k} active={config.look === k} onClick={() => update("look", k, "overview")}>
                  <LookIcon look={k} />
                  <span className="mt-3 block text-sm">{LOOKS[k].label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{LOOKS[k].note}</span>
                </Choice>
              ))}
            </div>
          </Group>

          <Group n="04" label="Inside walls">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(LININGS) as (keyof typeof LININGS)[]).map((k) => (
                <Choice key={k} active={config.lining === k} onClick={() => update("lining", k, "interior")}>
                  <span className="block text-sm">{LININGS[k].label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{LININGS[k].note}</span>
                </Choice>
              ))}
            </div>
          </Group>

          <Group n="05" label="Floor" value="Wipe-clean, turned up 50 mm">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(FLOORS) as (keyof typeof FLOORS)[]).map((k) => (
                <Choice key={k} active={config.floor === k} onClick={() => update("floor", k, "interior")}>
                  <span className="block text-sm">{FLOORS[k].label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{FLOORS[k].note}</span>
                </Choice>
              ))}
            </div>
          </Group>

          <Group n="06" label="Add-ons">
            <ul className="divide-y divide-line border-y border-line">
              {ADDON_KEYS.map((k) => (
                <li key={k}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.addons[k]}
                    onClick={() => toggleAddon(k)}
                    className="flex w-full items-center gap-4 py-4 text-left"
                  >
                    <span className="flex-1">
                      <span className="block text-sm">{ADDONS[k].label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">{ADDONS[k].note}</span>
                    </span>
                    <span className="text-sm tabular-nums text-ink-soft">+{formatAUD(addonPrice(k, config.size))}</span>
                    <Toggle on={config.addons[k]} />
                  </button>
                  {k === "lights" && config.addons.lights && !dusk && (
                    <button type="button" onClick={() => { setDusk(true); look("front"); }} className="link-arrow mb-4 text-ink-soft">
                      See it at dusk
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Group>

          <Group n="07" label="Name plaque" value={`${config.plaque.length}/${PLAQUE_MAX}`}>
            <input
              className="field text-lg uppercase tracking-[0.2em]"
              value={config.plaque}
              maxLength={PLAQUE_MAX}
              placeholder="YOUR DOG’S NAME"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-label="Name for the engraved plaque"
              onFocus={() => look("plaque")}
              onChange={(e) => update("plaque", cleanPlaque(e.target.value))}
            />
            <p className="mt-3 text-xs text-muted">Engraved on a satin bronze plaque on the sliding door. Included.</p>
          </Group>

          {/* Summary */}
          <section className="mt-14 border-t border-ink pt-8" aria-live="polite">
            <p className="eyebrow text-muted">Summary</p>
            <ul className="mt-5 space-y-2 text-sm">
              {lines.map((l) => (
                <li key={l.label} className="flex justify-between gap-4 text-ink-soft">
                  <span>{l.label}</span>
                  <span className="tabular-nums">{formatAUD(l.amount)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-4 text-ink-soft">
                <span>Name plaque{config.plaque ? ` · ${config.plaque}` : ""}</span>
                <span>Included</span>
              </li>
            </ul>
            <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
              <span className="text-sm">Indicative price, inc. GST</span>
              <span className="heading text-4xl tabular-nums">{formatAUD(total)}</span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Final pricing is confirmed after a site visit. Installation and any site works are quoted to your property.
            </p>
            <div className="mt-8 hidden flex-col gap-3 lg:flex">
              <Link href={enquireHref} className="btn btn-primary">
                Request this build
              </Link>
              <button type="button" onClick={share} className="btn btn-outline">
                {shareState === "copied" ? "Link copied" : "Share this design"}
              </button>
            </div>
            <button type="button" onClick={share} className="link-arrow mt-8 text-ink-soft lg:hidden">
              {shareState === "copied" ? "Link copied" : "Share this design"}
            </button>
            <p className="mt-10 text-xs leading-relaxed text-muted">
              We build a limited number of homes each month, by enquiry only.
            </p>
          </section>
        </div>
      </aside>

      {/* Mobile price bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.65rem] tracking-wide text-muted">Indicative, inc. GST</p>
            <p className="heading text-2xl tabular-nums">{formatAUD(total)}</p>
          </div>
          <Link href={enquireHref} className="btn btn-primary px-5">
            Request this build
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- small pieces ---------- */

function Group({ n, label, value, children }: { n: string; label: string; value?: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="flex items-baseline gap-3">
          <span className="font-serif text-sm text-muted">{n}</span>
          <span className="eyebrow">{label}</span>
        </h2>
        {value && <span className="truncate text-xs text-muted">{value}</span>}
      </div>
      {children}
    </section>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative p-4 text-left transition-[border-color,background-color] duration-700 ease-[var(--ease-lux)] ${
        active ? "border border-ink bg-white/60" : "border border-line hover:border-stone"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-500 ease-[var(--ease-lux)] ${on ? "bg-ink" : "bg-stone"}`}
    >
      <span
        className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-paper transition-transform duration-500 ease-[var(--ease-lux)] ${on ? "translate-x-4" : ""}`}
      />
    </span>
  );
}

function Pill({ dark, children, ...props }: { dark: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`min-h-10 px-4 text-[0.68rem] font-semibold tracking-[0.16em] uppercase backdrop-blur-md transition-colors duration-700 ${
        dark ? "bg-white/10 text-paper hover:bg-white/20" : "bg-paper/80 text-ink hover:bg-paper"
      }`}
    >
      {children}
    </button>
  );
}

function Segmented({ dark, options }: { dark: boolean; options: { label: string; active: boolean; onClick: () => void }[] }) {
  return (
    <div className={`flex backdrop-blur-md ${dark ? "bg-white/10" : "bg-paper/80"}`} role="group" aria-label="Lighting">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          aria-pressed={o.active}
          onClick={o.onClick}
          className={`min-h-10 px-4 text-[0.68rem] font-semibold tracking-[0.16em] uppercase transition-colors duration-700 ${
            o.active ? (dark ? "bg-paper text-ink" : "bg-ink text-paper") : dark ? "text-paper/80" : "text-ink/70"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function LookIcon({ look }: { look: keyof typeof LOOKS }) {
  return (
    <svg viewBox="0 0 60 36" className="h-9 w-15 text-ink-soft" aria-hidden>
      <rect x="0.5" y="0.5" width="59" height="35" fill="none" stroke="currentColor" strokeWidth="1" />
      {look === "bnb" && [8, 16, 24, 32, 40, 48].map((x) => <line key={x} x1={x + 2} y1="1" x2={x + 2} y2="35" stroke="currentColor" strokeWidth="1.2" />)}
    </svg>
  );
}
