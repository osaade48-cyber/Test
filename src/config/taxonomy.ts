import type { AgeGroup, CategoryId, Condition, Gender } from "@/types/models";

export interface CategoryDef {
  id: CategoryId;
  label: string;
  short: string;
  hint: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "clothing", label: "Clothing", short: "Clothing", hint: "Sizes 0000 to 14" },
  { id: "prams", label: "Prams & strollers", short: "Prams", hint: "Prams, strollers, bassinets" },
  { id: "car-seats", label: "Car seats", short: "Car seats", hint: "Capsules, convertibles, boosters" },
  { id: "nursery", label: "Nursery furniture", short: "Nursery", hint: "Cots, bassinets, change tables" },
  { id: "high-chairs", label: "High chairs", short: "High chairs", hint: "High chairs & boosters" },
  { id: "feeding", label: "Feeding", short: "Feeding", hint: "Bottles, pumps, bibs" },
  { id: "carriers", label: "Carriers & wraps", short: "Carriers", hint: "Carriers, wraps, slings" },
  { id: "toys", label: "Toys & play", short: "Toys", hint: "Play mats, bouncers, toys" },
  { id: "books", label: "Books", short: "Books", hint: "Board books, picture books" },
  { id: "bath", label: "Bath & care", short: "Bath", hint: "Baths, towels, monitors" },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

export const AGE_GROUPS: { id: AgeGroup; label: string; months: [number, number] }[] = [
  { id: "newborn", label: "0–3 months", months: [0, 3] },
  { id: "3-6m", label: "3–6 months", months: [3, 6] },
  { id: "6-12m", label: "6–12 months", months: [6, 12] },
  { id: "12-24m", label: "1–2 years", months: [12, 24] },
  { id: "2-3y", label: "2–3 years", months: [24, 36] },
  { id: "3-5y", label: "3–5 years", months: [36, 60] },
  { id: "5-8y", label: "5–8 years", months: [60, 96] },
  { id: "8y+", label: "8+ years", months: [96, 168] },
  { id: "all", label: "All ages", months: [0, 168] },
];

export const ageLabel = (a: AgeGroup) => AGE_GROUPS.find((g) => g.id === a)?.label ?? a;

export const CONDITIONS: { id: Condition; label: string; hint: string }[] = [
  { id: "new_with_tags", label: "New with tags", hint: "Never used, tags or packaging on" },
  { id: "like_new", label: "Like new", hint: "Used a handful of times, no marks" },
  { id: "good", label: "Good", hint: "Gently used, minor signs of wear" },
  { id: "fair", label: "Fair", hint: "Visible wear, fully functional — describe any marks" },
];

export const conditionLabel = (c: Condition) => CONDITIONS.find((x) => x.id === c)?.label ?? c;

export const GENDERS: { id: Gender; label: string }[] = [
  { id: "girls", label: "Girls" },
  { id: "boys", label: "Boys" },
  { id: "unisex", label: "Unisex" },
];

export const CLOTHING_SIZES = ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7", "8", "10", "12", "14"];

/**
 * "Coming up next" suggestions for a child's next stage.
 * Keyed by the age group the child is moving INTO.
 */
export const NEXT_STAGE: Partial<Record<AgeGroup, { categories: CategoryId[]; blurb: string }>> = {
  newborn: { categories: ["prams", "nursery", "carriers", "clothing"], blurb: "bassinets, carriers and size 0000" },
  "3-6m": { categories: ["toys", "clothing", "carriers"], blurb: "play mats, bouncers and size 000" },
  "6-12m": { categories: ["high-chairs", "feeding", "clothing", "car-seats"], blurb: "high chairs, feeding gear and size 0" },
  "12-24m": { categories: ["toys", "clothing", "books", "car-seats"], blurb: "walkers, board books and size 1" },
  "2-3y": { categories: ["toys", "clothing", "books"], blurb: "balance bikes, picture books and size 2–3" },
  "3-5y": { categories: ["toys", "clothing", "car-seats", "books"], blurb: "boosters, puzzles and size 4–5" },
  "5-8y": { categories: ["clothing", "books", "toys"], blurb: "school clothes, chapter books and bikes" },
  "8y+": { categories: ["clothing", "books"], blurb: "clothing size 8+ and books" },
};

// ─── Safety checklists ────────────────────────────────────────────────────

export interface SafetyQuestion {
  id: string;
  question: string;
}

export const SAFETY_CHECKLISTS: Partial<Record<CategoryId, SafetyQuestion[]>> = {
  prams: [
    { id: "brakes", question: "Brakes lock firmly on both rear wheels" },
    { id: "harness", question: "5-point harness and buckles work and aren't frayed" },
    { id: "frame", question: "Frame has no cracks, bends or missing parts" },
    { id: "fold", question: "Folding mechanism locks securely in the open position" },
    { id: "standard", question: "Complies with AS/NZS 2088 (check the label)" },
  ],
  "car-seats": [
    { id: "accident", question: "Never been in a car accident (even a minor one)" },
    { id: "standard", question: "Has the AS/NZS 1754 compliance sticker" },
    { id: "parts", question: "All parts, straps and the instruction manual are included" },
    { id: "harness", question: "Harness and buckle are not frayed or damaged" },
    { id: "shell", question: "Shell has no cracks or stress marks" },
  ],
  nursery: [
    { id: "standard", question: "Cot complies with AS/NZS 2172 (check the label)" },
    { id: "gaps", question: "Bar gaps are between 50 mm and 95 mm" },
    { id: "parts", question: "All bolts, screws and parts are included and tight" },
    { id: "paint", question: "No peeling paint, splinters or sharp edges" },
    { id: "mattress", question: "Mattress (if included) fits snugly with no gaps over 20 mm" },
  ],
  "high-chairs": [
    { id: "harness", question: "Has a working 5-point harness" },
    { id: "stable", question: "Stable with legs that lock in place" },
    { id: "tray", question: "Tray locks securely and has no cracks" },
    { id: "standard", question: "Meets AS/NZS 4684 or equivalent standard" },
  ],
  carriers: [
    { id: "buckles", question: "All buckles click and hold securely" },
    { id: "fabric", question: "No tears, worn straps or loose stitching" },
    { id: "manual", question: "Weight limits are on the label or manual is included" },
    { id: "position", question: "Supports an upright, airway-clear position (T.I.C.K.S.)" },
  ],
};
