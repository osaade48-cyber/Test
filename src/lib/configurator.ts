/**
 * The single source of truth for the configurator: options, prices, defaults,
 * pricing and the URL format used for share links and the enquiry form.
 * Shared by the client (configurator UI) and the server (enquiry email), so the
 * price in the email is always recalculated rather than trusted from the browser.
 */

export const SIZES = {
  M: { label: "Medium", dogs: "10–25 kg dogs", W: 1.3, D: 0.85, H: 0.8, base: 3450, deck: 650 },
  L: { label: "Large", dogs: "25–45 kg dogs", W: 1.7, D: 1.0, H: 0.92, base: 3950, deck: 750 },
} as const;
export type SizeKey = keyof typeof SIZES;

/** Panel colours. Roof and trim are always charcoal; timber is always one dark shade. */
export const COLOURS = {
  white: { label: "White", colorbond: "Surfmist", hex: "#E4E2D9" },
  neutral: { label: "Neutral", colorbond: "Dune", hex: "#B1ADA3" },
  charcoal: { label: "Charcoal", colorbond: "Monument", hex: "#3A3B3C" },
} as const;
export type ColourKey = keyof typeof COLOURS;

export const LOOKS = {
  flat: { label: "Flat panel", note: "Clean and minimal" },
  bnb: { label: "Board & batten", note: "Fine vertical lines" },
} as const;
export type LookKey = keyof typeof LOOKS;

export const LININGS = {
  ply: { label: "Birch ply", note: "Warm, natural timber" },
  white: { label: "Painted white", note: "Bright and clean" },
} as const;
export type LiningKey = keyof typeof LININGS;

export const FLOORS = {
  vinyl: { label: "Timber-look vinyl", note: "Included", price: 0 },
  rubber: { label: "Non-slip rubber", note: "+$120", price: 120 },
} as const;
export type FloorKey = keyof typeof FLOORS;

export const ADDONS = {
  deck: { label: "Deck platform", note: "Composite timber-look decking across the front" },
  lights: { label: "LED lighting kit", note: "Warm LED under the roof edges, deck and planter" },
  planter: { label: "Planter box", note: "Matching planter along the left side, planted" },
  bed: { label: "Premium washable bed", note: "Made to fit, removable washable cover" },
} as const;
export type AddonKey = keyof typeof ADDONS;
export const ADDON_KEYS = Object.keys(ADDONS) as AddonKey[];

export function addonPrice(key: AddonKey, size: SizeKey): number {
  switch (key) {
    case "deck":
      return SIZES[size].deck;
    case "lights":
      return 395;
    case "planter":
      return 395;
    case "bed":
      return 249;
  }
}

export const PLAQUE_MAX = 12;

export type Config = {
  size: SizeKey;
  colour: ColourKey;
  look: LookKey;
  lining: LiningKey;
  floor: FloorKey;
  addons: Record<AddonKey, boolean>;
  plaque: string;
};

export const DEFAULT_CONFIG: Config = {
  size: "L",
  colour: "charcoal",
  look: "flat",
  lining: "ply",
  floor: "vinyl",
  addons: { deck: true, lights: true, planter: true, bed: false },
  plaque: "",
};

export function cleanPlaque(v: string): string {
  return v
    .toUpperCase()
    .replace(/[^A-Z0-9 &'.\-]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, PLAQUE_MAX);
}

/* ---------- pricing ---------- */

export type PriceLine = { label: string; amount: number };

export function priceLines(c: Config): PriceLine[] {
  const s = SIZES[c.size];
  const lines: PriceLine[] = [{ label: `${s.label} home`, amount: s.base }];
  if (FLOORS[c.floor].price) lines.push({ label: FLOORS[c.floor].label, amount: FLOORS[c.floor].price });
  for (const k of ADDON_KEYS) if (c.addons[k]) lines.push({ label: ADDONS[k].label, amount: addonPrice(k, c.size) });
  return lines;
}

export function totalPrice(c: Config): number {
  return priceLines(c).reduce((t, l) => t + l.amount, 0);
}

export const formatAUD = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);

/* ---------- human readable summary (enquiry form + email) ---------- */

export function summaryRows(c: Config): [string, string][] {
  const s = SIZES[c.size];
  const col = COLOURS[c.colour];
  const addons = ADDON_KEYS.filter((k) => c.addons[k]).map((k) => ADDONS[k].label);
  return [
    ["Size", `${s.label} (${s.dogs})`],
    ["Panel colour", `${col.label} · Colorbond ${col.colorbond}`],
    ["Panel look", LOOKS[c.look].label],
    ["Inside walls", LININGS[c.lining].label],
    ["Floor", FLOORS[c.floor].label],
    ["Add-ons", addons.length ? addons.join(", ") : "None"],
    ["Name plaque", c.plaque || "Not set"],
  ];
}

/* ---------- URL encoding ---------- */
// Readable, stable query keys: /configure?size=L&colour=charcoal&look=flat&inside=ply&floor=vinyl&addons=deck,lights&name=CHARLIE

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function read(src: ParamSource, key: string): string | undefined {
  if (src instanceof URLSearchParams) return src.get(key) ?? undefined;
  const v = src[key];
  return Array.isArray(v) ? v[0] : v;
}

const pick = <T extends string>(v: string | undefined, allowed: Record<T, unknown>, fallback: T): T =>
  v && Object.prototype.hasOwnProperty.call(allowed, v) ? (v as T) : fallback;

/** Parse a configuration from URL params. Returns null if no configuration keys are present. */
export function configFromParams(src: ParamSource): Config | null {
  if (!read(src, "size")) return null;
  const d = DEFAULT_CONFIG;
  const addonList = (read(src, "addons") ?? "").split(",").filter(Boolean);
  return {
    size: pick(read(src, "size"), SIZES, d.size),
    colour: pick(read(src, "colour"), COLOURS, d.colour),
    look: pick(read(src, "look"), LOOKS, d.look),
    lining: pick(read(src, "inside"), LININGS, d.lining),
    floor: pick(read(src, "floor"), FLOORS, d.floor),
    addons: Object.fromEntries(ADDON_KEYS.map((k) => [k, addonList.includes(k)])) as Config["addons"],
    plaque: cleanPlaque(read(src, "name") ?? ""),
  };
}

export function configToParams(c: Config): URLSearchParams {
  const p = new URLSearchParams();
  p.set("size", c.size);
  p.set("colour", c.colour);
  p.set("look", c.look);
  p.set("inside", c.lining);
  p.set("floor", c.floor);
  p.set("addons", ADDON_KEYS.filter((k) => c.addons[k]).join(","));
  if (c.plaque) p.set("name", c.plaque);
  return p;
}

/** Validate an untrusted object (e.g. a JSON request body) into a Config. */
export function configFromUnknown(v: unknown): Config | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const addons = (o.addons && typeof o.addons === "object" ? o.addons : {}) as Record<string, unknown>;
  const d = DEFAULT_CONFIG;
  return {
    size: pick(typeof o.size === "string" ? o.size : undefined, SIZES, d.size),
    colour: pick(typeof o.colour === "string" ? o.colour : undefined, COLOURS, d.colour),
    look: pick(typeof o.look === "string" ? o.look : undefined, LOOKS, d.look),
    lining: pick(typeof o.lining === "string" ? o.lining : undefined, LININGS, d.lining),
    floor: pick(typeof o.floor === "string" ? o.floor : undefined, FLOORS, d.floor),
    addons: Object.fromEntries(ADDON_KEYS.map((k) => [k, addons[k] === true])) as Config["addons"],
    plaque: cleanPlaque(typeof o.plaque === "string" ? o.plaque : ""),
  };
}
