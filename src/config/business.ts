/**
 * Kindo business rules — the ONE place for fees, thresholds, timings and
 * feature flags. Never hard-code any of these numbers in a component.
 *
 * When the backend exists, the server must enforce the same values (ideally it
 * serves them to the client so the two can never drift).
 */

import type { CategoryId, SatchelSize } from "@/types/models";

export const CURRENCY = "AUD";
export const LOCALE = "en-AU";

// ─── Buyer protection fee ──────────────────────────────────────────────────
export const BUYER_FEE_PERCENT = 5; // % of item subtotal
export const BUYER_FEE_FIXED = 1.5; // AUD per order
export const BUYER_FEE_CAP = 30.0; // AUD max per order
export const SELLER_FEE_PERCENT = 0; // sellers pay nothing

// ─── Shipping ──────────────────────────────────────────────────────────────
/** Per seller, item prices only. At or above this the seller covers postage. */
export const FREE_SHIPPING_THRESHOLD = 75.0;

/** Beyond this distance, pickup/meetup is treated as impractical: cards say so and post becomes the default. */
export const MAX_PICKUP_DISTANCE_KM = 50;

/** Categories that are always "large items": pickup, meetup or calculated shipping only. */
export const LARGE_ITEM_CATEGORIES: CategoryId[] = ["prams", "nursery", "high-chairs"];

/**
 * AusPost satchel prices shown to buyers.
 * TODO(shipping): placeholder prices — replace with live AusPost rates.
 */
export const SATCHELS: Record<SatchelSize, { label: string; price: number; fits: string }> = {
  S: { label: "AusPost Satchel S", price: 11.5, fits: "Up to 5 kg · a few clothing items, books" },
  M: { label: "AusPost Satchel M", price: 15.95, fits: "Up to 5 kg · a clothing bundle, shoes" },
  L: { label: "AusPost Satchel L", price: 19.95, fits: "Up to 5 kg · bulky clothing, small toys" },
  XL: { label: "AusPost Satchel XL", price: 24.95, fits: "Up to 5 kg · bouncers, play mats" },
};

/**
 * Mock courier estimate for large items, per item.
 * TODO(shipping): replace with a real courier quote by buyer postcode.
 */
export const LARGE_ITEM_COURIER_BASE = 39.0;
export const LARGE_ITEM_COURIER_PER_KM = 0.12;

// ─── Escrow & orders ───────────────────────────────────────────────────────
export const AUTO_CONFIRM_DAYS = 3; // days after carrier marks delivered
export const REFUND_BUSINESS_DAYS = "5–10"; // shown in refund messaging
export const OFFER_EXPIRY_HOURS = 24;
export const HANDOVER_CODE_LENGTH = 6;

// ─── Kindo Pro ─────────────────────────────────────────────────────────────
export const PRO_PRICE_MONTHLY = 9.99;
export const PRO_PRICE_ANNUAL = 99.0;
export const PRO_FREE_BOOSTS = 4;
export const BOOST_PRICE = 2.99;
export const BOOST_DURATION_DAYS = 3;
/**
 * Marketing stats for the Pro page. Leave empty until there is real data —
 * the layout renders whatever is here (e.g. { value: "2.4×", label: "More views" }).
 */
export const PRO_STATS: { value: string; label: string }[] = [];

// ─── Trust tiers ───────────────────────────────────────────────────────────
export const TRUST_TIERS = {
  new: { label: "New", next: "trusted" },
  trusted: { label: "Trusted", next: "verified", minCompletedSales: 3, minRating: 4.5 },
  verified: { label: "Verified", next: "pro", minCompletedSales: 10, minRating: 4.7, requiresIdCheck: true },
  pro: { label: "Pro", next: null, requiresPro: true },
} as const;

// ─── Safety ────────────────────────────────────────────────────────────────
/** Car seats expire this many years after manufacture (check the label — most AU seats are 10). */
export const CAR_SEAT_LIFESPAN_YEARS = 10;

// ─── Listing rules ─────────────────────────────────────────────────────────
export const MIN_LISTING_PHOTOS = 2;
export const MAX_LISTING_PHOTOS = 10;
export const MAX_TITLE_LENGTH = 80;

// ─── Landing page social proof ─────────────────────────────────────────────
/** Each stat is hidden until it passes its threshold. */
export const STATS_THRESHOLDS = {
  listings: 500,
  sellers: 100,
  rating: { min: 4.5, minReviews: 50 },
};

// ─── Mock service layer ────────────────────────────────────────────────────
export const MOCK_LATENCY_MS = { min: 250, max: 650 };

// ─── Feature flags ─────────────────────────────────────────────────────────
export const FEATURES = {
  bundleCart: true,
  qrHandover: true,
  childProfiles: true,
  savedSearches: true,
  priceDropAlerts: true,
  safetyChecklists: true,
  recallCheck: true,
  bundleListings: true,
  reviewsAndTrustTiers: true,
  offerCounters: true,
  shareListing: true,
  quickRelist: true,
  /** Demo helper: shows the seller's handover code to the buyer. NEVER enable in production. */
  demoShowHandoverCode: true,
} as const;
