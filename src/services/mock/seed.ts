/**
 * Demo seed data. Realistic listings across every category, age and condition,
 * several sellers, orders in every state, a dispute, a report and reviews.
 *
 * Photos use `mock:<category>:<n>` placeholders rendered by <ListingImage>.
 * Dates are generated relative to "now" so the demo always looks fresh.
 */
import type {
  Child,
  Conversation,
  Dispute,
  Listing,
  Location,
  Message,
  Notification,
  Offer,
  Order,
  Payout,
  PayoutAccount,
  Report,
  Review,
  SavedItem,
  SavedSearch,
  Subscription,
  User,
} from "@/types/models";
import { carSeatExpiry } from "@/lib/safety";
import { priceOrder } from "@/lib/pricing";
import { SAFETY_CHECKLISTS } from "@/config/taxonomy";
import { AUTO_CONFIRM_DAYS, OFFER_EXPIRY_HOURS } from "@/config/business";

const DAY = 864e5;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 36e5).toISOString();
const ahead = (days: number, hours = 0) => new Date(Date.now() + days * DAY + hours * 36e5).toISOString();

// Suburb centroids only — never street addresses.
const LOC: Record<string, Location> = {
  dural: { suburb: "Dural", state: "NSW", postcode: "2158", lat: -33.683, lng: 151.028 },
  castleHill: { suburb: "Castle Hill", state: "NSW", postcode: "2154", lat: -33.731, lng: 151.004 },
  parramatta: { suburb: "Parramatta", state: "NSW", postcode: "2150", lat: -33.815, lng: 151.001 },
  manly: { suburb: "Manly", state: "NSW", postcode: "2095", lat: -33.797, lng: 151.285 },
  newtown: { suburb: "Newtown", state: "NSW", postcode: "2042", lat: -33.897, lng: 151.179 },
  hornsby: { suburb: "Hornsby", state: "NSW", postcode: "2077", lat: -33.703, lng: 151.099 },
  brunswick: { suburb: "Brunswick", state: "VIC", postcode: "3056", lat: -37.767, lng: 144.961 },
  paddington: { suburb: "Paddington", state: "QLD", postcode: "4064", lat: -27.46, lng: 152.999 },
};

export const CURRENT_USER_ID = "u_sam";

const users: User[] = [
  {
    id: "u_sam", name: "Sam Taylor", avatarColor: "#C77DA0", email: "sam@example.com", location: LOC.castleHill,
    joinedAt: ago(220), isAdmin: true, isPro: false, trustTier: "trusted", idVerified: false, rating: 4.8, reviewCount: 6,
    completedSales: 5, responseTimeHours: 2, bio: "Mum of two in the Hills. Everything comes from a smoke-free, pet-free home.", status: "active",
  },
  {
    id: "u_oliver", name: "Oliver Nguyen", avatarColor: "#7FA8C9", location: LOC.dural, joinedAt: ago(400), trustTier: "verified",
    idVerified: true, rating: 4.9, reviewCount: 23, completedSales: 27, responseTimeHours: 1, bio: "Dad of three. Gear is cleaned and checked before listing.", status: "active",
  },
  {
    id: "u_elijah", name: "Elijah Brooks", avatarColor: "#9C86C6", location: LOC.parramatta, joinedAt: ago(150), trustTier: "trusted",
    rating: 4.7, reviewCount: 9, completedSales: 8, responseTimeHours: 4, status: "active",
  },
  {
    id: "u_priya", name: "Priya Sharma", avatarColor: "#D9926E", location: LOC.hornsby, joinedAt: ago(600), isPro: true, trustTier: "pro",
    idVerified: true, rating: 5.0, reviewCount: 41, completedSales: 52, responseTimeHours: 1, bio: "Kindo Pro seller. Clothing bundles sorted by size.", status: "active",
  },
  {
    id: "u_mia", name: "Mia Chen", avatarColor: "#6FB59A", location: LOC.newtown, joinedAt: ago(40), trustTier: "new",
    rating: null, reviewCount: 0, completedSales: 1, responseTimeHours: 8, status: "active",
  },
  {
    id: "u_jack", name: "Jack Wilson", avatarColor: "#B8A06A", location: LOC.manly, joinedAt: ago(90), trustTier: "new",
    rating: 4.0, reviewCount: 2, completedSales: 2, responseTimeHours: 12, status: "warned",
  },
  {
    id: "u_grace", name: "Grace O'Brien", avatarColor: "#C98A8A", location: LOC.brunswick, joinedAt: ago(300), trustTier: "trusted",
    rating: 4.6, reviewCount: 11, completedSales: 12, responseTimeHours: 3, status: "active",
  },
  {
    id: "u_noah", name: "Noah Patel", avatarColor: "#8A9BC9", location: LOC.paddington, joinedAt: ago(70), trustTier: "new",
    rating: 4.5, reviewCount: 2, completedSales: 2, responseTimeHours: 6, status: "active",
  },
];

const photos = (cat: string, n: number, alt: string) =>
  Array.from({ length: n }, (_, i) => ({ id: `p_${cat}_${i}_${Math.random().toString(36).slice(2, 6)}`, url: `mock:${cat}:${i}`, alt: `${alt} — photo ${i + 1}` }));

const safetyFor = (cat: keyof typeof SAFETY_CHECKLISTS, extra: Partial<NonNullable<Listing["safety"]>> = {}) => ({
  completed: true,
  completedAt: ago(5),
  answers: (SAFETY_CHECKLISTS[cat] ?? []).map((q) => ({ questionId: q.id, question: q.question, answer: true })),
  ...extra,
});

type L = Omit<Listing, "photos" | "createdAt" | "updatedAt" | "status" | "recallStatus" | "isLargeItem"> &
  Partial<Pick<Listing, "status" | "recallStatus" | "isLargeItem">> & { daysAgo: number; nPhotos?: number };

const raw: L[] = [
  // ── Prams (large) ──
  {
    id: "l_vista_v2", sellerId: "u_oliver", title: "UPPAbaby Vista V2 pram with bassinet — Jordan grey", brand: "UPPAbaby", model: "Vista V2",
    description: "Our first pram, used for one child. Includes bassinet, toddler seat, rain cover and cup holder. Tyres in great shape, brakes and fold work perfectly. Small scuff on the bumper bar (pictured). Cleaned and ready to go.",
    category: "prams", condition: "good", ageGroup: "all", price: 650, originalPrice: 720, location: LOC.dural, isLargeItem: true,
    delivery: { pickup: true, meetup: true, largeCalculated: true }, safety: safetyFor("prams"), recallStatus: "no_recalls",
    views: 212, saves: 18, daysAgo: 2, nPhotos: 4,
  },
  {
    id: "l_bugaboo_fox", sellerId: "u_grace", title: "Bugaboo Fox 3 complete — Midnight black", brand: "Bugaboo", model: "Fox 3",
    description: "Bassinet and seat. Used for about 10 months. All-terrain wheels, one-piece fold. Comes with the footmuff and sun canopy extension.",
    category: "prams", condition: "like_new", ageGroup: "all", price: 890, location: LOC.brunswick, isLargeItem: true,
    delivery: { pickup: true, meetup: false, largeCalculated: true }, safety: safetyFor("prams"), recallStatus: "no_recalls",
    views: 340, saves: 31, daysAgo: 1, nPhotos: 3,
  },
  {
    id: "l_babyzen", sellerId: "u_mia", title: "Babyzen YOYO2 travel stroller 6+", brand: "Babyzen", model: "YOYO2",
    description: "Perfect for travel — folds small enough for overhead lockers. Taupe colour pack. Some fading on the canopy from sun.",
    category: "prams", condition: "fair", ageGroup: "6-12m", price: 320, location: LOC.newtown, isLargeItem: true,
    delivery: { pickup: true, meetup: true }, safety: safetyFor("prams"), recallStatus: "not_checked",
    views: 64, saves: 4, daysAgo: 6,
  },
  // ── Car seats ──
  {
    id: "l_britax", sellerId: "u_priya", title: "Britax Safe-n-Sound Graphene+ convertible car seat", brand: "Britax", model: "Graphene+",
    description: "Rear and forward facing, 0–4 years. Never been in an accident. Covers machine washed. Manual included.",
    category: "car-seats", condition: "good", ageGroup: "all", price: 280, location: LOC.hornsby,
    delivery: { pickup: true, meetup: true }, recallStatus: "no_recalls",
    safety: safetyFor("car-seats", { manufactureDate: "2021-03-01T00:00:00.000Z", expiryDate: carSeatExpiry("2021-03-01T00:00:00.000Z") }),
    views: 120, saves: 9, daysAgo: 4,
  },
  {
    id: "l_maxi_capsule", sellerId: "u_jack", title: "Maxi-Cosi Mico capsule with base", brand: "Maxi-Cosi", model: "Mico",
    description: "Infant capsule with ISOFIX base. Older model — check the expiry before you buy.",
    category: "car-seats", condition: "fair", ageGroup: "newborn", price: 60, location: LOC.manly,
    delivery: { pickup: true, meetup: false }, recallStatus: "recall_notice",
    safety: safetyFor("car-seats", { manufactureDate: "2015-06-01T00:00:00.000Z", expiryDate: carSeatExpiry("2015-06-01T00:00:00.000Z") }),
    views: 38, saves: 1, daysAgo: 9,
  },
  // ── Nursery (large) ──
  {
    id: "l_boori_cot", sellerId: "u_elijah", title: "Boori Natty cot bed with mattress — white", brand: "Boori", model: "Natty",
    description: "Converts to a toddler bed. Mattress included (used with a protector the whole time). All bolts included. Some teething marks on the top rail.",
    category: "nursery", condition: "good", ageGroup: "all", price: 340, location: LOC.parramatta, isLargeItem: true,
    delivery: { pickup: true, meetup: false, largeCalculated: true }, safety: safetyFor("nursery"), recallStatus: "no_recalls",
    views: 98, saves: 12, daysAgo: 3, nPhotos: 3,
  },
  {
    id: "l_snoo", sellerId: "u_grace", title: "Happiest Baby SNOO smart bassinet", brand: "Happiest Baby", model: "SNOO",
    description: "Includes 3 sleep sacks (S, M, L) and the legs. App works perfectly. Original box.",
    category: "nursery", condition: "like_new", ageGroup: "newborn", price: 1100, location: LOC.brunswick, isLargeItem: true,
    delivery: { pickup: true, meetup: false, largeCalculated: true }, safety: safetyFor("nursery"), recallStatus: "no_recalls",
    views: 410, saves: 44, daysAgo: 5,
  },
  // ── High chairs (large) ──
  {
    id: "l_stokke_tripp", sellerId: "u_oliver", title: "Stokke Tripp Trapp high chair with baby set", brand: "Stokke", model: "Tripp Trapp",
    description: "Natural beech. Includes baby set and harness. Grows with your child — we used it from 6 months to 5 years.",
    category: "high-chairs", condition: "good", ageGroup: "6-12m", price: 260, location: LOC.dural, isLargeItem: true,
    delivery: { pickup: true, meetup: true, largeCalculated: true }, safety: safetyFor("high-chairs"), recallStatus: "no_recalls",
    views: 150, saves: 15, daysAgo: 1,
  },
  {
    id: "l_ikea_antilop", sellerId: "u_mia", title: "IKEA Antilop high chair with tray", brand: "IKEA", model: "Antilop",
    description: "Simple and easy to clean. Legs come off for transport.",
    category: "high-chairs", condition: "good", ageGroup: "6-12m", price: 20, location: LOC.newtown, isLargeItem: true,
    delivery: { pickup: true, meetup: true }, safety: safetyFor("high-chairs"), recallStatus: "not_checked",
    views: 22, saves: 2, daysAgo: 12,
  },
  // ── Clothing ──
  {
    id: "l_bundle_00", sellerId: "u_priya", title: "Size 00 girls winter bundle — 12 items", brand: "Mixed brands",
    description: "12 pieces: 4 onesies (Bonds, Purebaby), 3 leggings, 2 knit cardigans, 2 sleepsuits, 1 beanie. All washed, no stains.",
    category: "clothing", condition: "good", ageGroup: "3-6m", size: "00", gender: "girls", price: 45, location: LOC.hornsby,
    isBundle: true, bundleItemCount: 12, delivery: { post: { satchel: "M" }, pickup: true, meetup: false }, recallStatus: "not_checked",
    views: 88, saves: 11, daysAgo: 0, nPhotos: 3,
  },
  {
    id: "l_purebaby_set", sellerId: "u_priya", title: "Purebaby organic zip growsuit — size 0", brand: "Purebaby",
    description: "Pale sage, organic cotton. Worn twice.", category: "clothing", condition: "like_new", ageGroup: "6-12m", size: "0", gender: "unisex",
    price: 18, location: LOC.hornsby, delivery: { post: { satchel: "S" }, pickup: true, meetup: false }, recallStatus: "not_checked",
    views: 30, saves: 3, daysAgo: 2,
  },
  {
    id: "l_seed_dress", sellerId: "u_priya", title: "Seed Heritage linen dress — size 2", brand: "Seed Heritage",
    description: "Blush pink linen dress with button back.", category: "clothing", condition: "like_new", ageGroup: "2-3y", size: "2", gender: "girls",
    price: 22, location: LOC.hornsby, delivery: { post: { satchel: "S" }, pickup: true, meetup: false }, recallStatus: "not_checked",
    views: 19, saves: 2, daysAgo: 3,
  },
  {
    id: "l_nike_tee", sellerId: "u_sam", title: "Tommy Hilfiger kids logo T-shirt — size 6", brand: "Tommy Hilfiger",
    description: "Black cotton tee with logo print. Brand new with tags — wrong size gift.", category: "clothing", condition: "new_with_tags",
    ageGroup: "5-8y", size: "6", gender: "boys", price: 28, location: LOC.castleHill, delivery: { post: { satchel: "S" }, pickup: true, meetup: true },
    recallStatus: "not_checked", views: 84, saves: 1, daysAgo: 8,
  },
  {
    id: "l_bonds_wondersuits", sellerId: "u_sam", title: "Bonds Wondersuits × 5 — size 000", brand: "Bonds",
    description: "Five zip wondersuits in neutral prints. Washed in sensitive detergent.", category: "clothing", condition: "good",
    ageGroup: "newborn", size: "000", gender: "unisex", price: 30, location: LOC.castleHill, isBundle: true, bundleItemCount: 5,
    delivery: { post: { satchel: "S" }, pickup: true, meetup: true }, recallStatus: "not_checked", views: 46, saves: 6, daysAgo: 5, nPhotos: 2,
  },
  {
    id: "l_patagonia", sellerId: "u_grace", title: "Patagonia baby puff jacket — 12–18 months", brand: "Patagonia",
    description: "Warm and packable. Small mark on the cuff, otherwise great.", category: "clothing", condition: "good", ageGroup: "12-24m", size: "1",
    gender: "unisex", price: 55, location: LOC.brunswick, delivery: { post: { satchel: "M" }, pickup: true, meetup: false }, recallStatus: "not_checked",
    views: 61, saves: 7, daysAgo: 2,
  },
  {
    id: "l_school_bundle", sellerId: "u_noah", title: "School uniform bundle — size 8, 6 items", brand: "Lowes",
    description: "2 polos, 2 shorts, 1 jumper, 1 hat. Navy.", category: "clothing", condition: "fair", ageGroup: "8y+", size: "8", gender: "boys",
    price: 25, location: LOC.paddington, isBundle: true, bundleItemCount: 6, delivery: { post: { satchel: "L" }, pickup: true, meetup: true },
    recallStatus: "not_checked", views: 15, saves: 0, daysAgo: 11,
  },
  // ── Feeding ──
  {
    id: "l_spectra", sellerId: "u_elijah", title: "Spectra S1 Plus breast pump", brand: "Spectra", model: "S1 Plus",
    description: "Hospital-grade double pump, rechargeable. New flanges and valves included (unopened). Motor only used for 4 months.",
    category: "feeding", condition: "good", ageGroup: "newborn", price: 180, location: LOC.parramatta,
    delivery: { post: { satchel: "L" }, pickup: true, meetup: true }, recallStatus: "no_recalls", views: 140, saves: 14, daysAgo: 1,
  },
  {
    id: "l_bibs", sellerId: "u_oliver", title: "Silicone bibs and suction plates set", brand: "Avanchy",
    description: "3 bibs, 2 suction plates, 2 spoons. Dishwasher safe.", category: "feeding", condition: "like_new", ageGroup: "6-12m",
    price: 24, location: LOC.dural, delivery: { post: { satchel: "S" }, pickup: true, meetup: true }, recallStatus: "not_checked",
    views: 25, saves: 3, daysAgo: 4,
  },
  // ── Carriers ──
  {
    id: "l_ergobaby", sellerId: "u_oliver", title: "Ergobaby Omni 360 carrier — Pearl grey", brand: "Ergobaby", model: "Omni 360",
    description: "All four carry positions, newborn ready without insert. Buckles all work. Washed.", category: "carriers", condition: "like_new",
    ageGroup: "all", price: 120, location: LOC.dural, delivery: { post: { satchel: "M" }, pickup: true, meetup: true },
    safety: safetyFor("carriers"), recallStatus: "no_recalls", views: 70, saves: 8, daysAgo: 3,
  },
  {
    id: "l_solly_wrap", sellerId: "u_mia", title: "Solly Baby wrap — sage", brand: "Solly Baby",
    description: "Lightweight stretchy wrap for newborns.", category: "carriers", condition: "good", ageGroup: "newborn", price: 40,
    location: LOC.newtown, delivery: { post: { satchel: "S" }, pickup: true, meetup: true }, safety: safetyFor("carriers"),
    recallStatus: "not_checked", views: 33, saves: 5, daysAgo: 7,
  },
  // ── Toys ──
  {
    id: "l_lovevery", sellerId: "u_grace", title: "Lovevery Play Gym", brand: "Lovevery",
    description: "Complete with all the cards and toys. Mat washed. Pickup preferred, can post.", category: "toys", condition: "like_new",
    ageGroup: "newborn", price: 150, location: LOC.brunswick, delivery: { post: { satchel: "XL" }, pickup: true, meetup: false },
    recallStatus: "no_recalls", views: 190, saves: 22, daysAgo: 2,
  },
  {
    id: "l_balance_bike", sellerId: "u_noah", title: "Kinderfeets wooden balance bike", brand: "Kinderfeets",
    description: "Adjustable seat, chalkboard frame. Some scratches from use.", category: "toys", condition: "fair", ageGroup: "2-3y", price: 45,
    location: LOC.paddington, delivery: { pickup: true, meetup: true }, recallStatus: "not_checked", views: 21, saves: 2, daysAgo: 6,
  },
  {
    id: "l_duplo", sellerId: "u_elijah", title: "LEGO DUPLO big tub — 140 pieces", brand: "LEGO",
    description: "Mixed DUPLO including animals and figures. Washed and sanitised.", category: "toys", condition: "good", ageGroup: "12-24m",
    price: 65, location: LOC.parramatta, delivery: { post: { satchel: "XL" }, pickup: true, meetup: true }, recallStatus: "not_checked",
    views: 77, saves: 9, daysAgo: 2,
  },
  {
    id: "l_jellycat", sellerId: "u_sam", title: "Jellycat Bashful Bunny — medium", brand: "Jellycat",
    description: "Beige, lightly loved. Smoke-free home.", category: "toys", condition: "good", ageGroup: "all", price: 15, location: LOC.castleHill,
    delivery: { post: { satchel: "S" }, pickup: true, meetup: true }, recallStatus: "not_checked", views: 28, saves: 2, daysAgo: 10,
  },
  // ── Books ──
  {
    id: "l_board_books", sellerId: "u_priya", title: "Board book bundle — 15 books", brand: "Mixed",
    description: "Includes The Very Hungry Caterpillar, Where Is the Green Sheep?, Hairy Maclary and more. Some chew marks on corners.",
    category: "books", condition: "good", ageGroup: "12-24m", price: 35, location: LOC.hornsby, isBundle: true, bundleItemCount: 15,
    delivery: { post: { satchel: "L" }, pickup: true, meetup: false }, recallStatus: "not_checked", views: 52, saves: 6, daysAgo: 1,
  },
  {
    id: "l_chapter_books", sellerId: "u_noah", title: "Zac Power chapter books × 10", brand: "Hardie Grant",
    description: "Great for 6–9 year olds.", category: "books", condition: "good", ageGroup: "5-8y", price: 20, location: LOC.paddington,
    isBundle: true, bundleItemCount: 10, delivery: { post: { satchel: "M" }, pickup: true, meetup: true }, recallStatus: "not_checked",
    views: 12, saves: 1, daysAgo: 13,
  },
  // ── Bath & care ──
  {
    id: "l_owlet", sellerId: "u_elijah", title: "Owlet Dream Sock baby monitor", brand: "Owlet", model: "Dream Sock",
    description: "Includes 3 sock sizes and base station. Works with the app.", category: "bath", condition: "like_new", ageGroup: "newborn",
    price: 210, location: LOC.parramatta, delivery: { post: { satchel: "M" }, pickup: true, meetup: true }, recallStatus: "no_recalls",
    views: 160, saves: 19, daysAgo: 0,
  },
  {
    id: "l_bath_set", sellerId: "u_jack", title: "Stokke Flexi Bath with newborn support", brand: "Stokke", model: "Flexi Bath",
    description: "Foldable baby bath. Newborn support insert included.", category: "bath", condition: "good", ageGroup: "newborn", price: 45,
    location: LOC.manly, delivery: { post: { satchel: "XL" }, pickup: true, meetup: true }, recallStatus: "not_checked",
    views: 27, saves: 3, daysAgo: 8,
  },
  // ── Seller's own: sold / archived (for My Listings tabs) ──
  {
    id: "l_sam_bouncer", sellerId: "u_sam", title: "BabyBjörn Bouncer Bliss — mesh grey", brand: "BabyBjörn", model: "Bouncer Bliss",
    description: "Ergonomic bouncer, folds flat.", category: "toys", condition: "good", ageGroup: "newborn", price: 140, location: LOC.castleHill,
    delivery: { post: { satchel: "XL" }, pickup: true, meetup: true }, recallStatus: "no_recalls", status: "sold",
    views: 95, saves: 10, daysAgo: 30,
  },
  {
    id: "l_sam_cot", sellerId: "u_sam", title: "Mocka Original cot — white", brand: "Mocka",
    description: "Sturdy cot, three base heights. Pickup only.", category: "nursery", condition: "good", ageGroup: "all", price: 150,
    location: LOC.castleHill, isLargeItem: true, delivery: { pickup: true, meetup: false }, safety: safetyFor("nursery"),
    recallStatus: "no_recalls", status: "reserved", views: 66, saves: 7, daysAgo: 14,
  },
  {
    id: "l_sam_bottles", sellerId: "u_sam", title: "Philips Avent bottle starter set", brand: "Philips Avent",
    description: "4 bottles, steriliser and bottle brush.", category: "feeding", condition: "good", ageGroup: "newborn", price: 35,
    location: LOC.castleHill, delivery: { post: { satchel: "M" }, pickup: true, meetup: true }, recallStatus: "not_checked",
    status: "archived", views: 40, saves: 2, daysAgo: 60,
  },
  {
    id: "l_sam_carrier_sold", sellerId: "u_sam", title: "Baby K'tan carrier — size M", brand: "Baby K'tan",
    description: "Black, washed.", category: "carriers", condition: "good", ageGroup: "newborn", price: 40, location: LOC.castleHill,
    delivery: { post: { satchel: "S" }, pickup: true, meetup: true }, safety: safetyFor("carriers"), recallStatus: "not_checked",
    status: "sold", views: 30, saves: 3, daysAgo: 45,
  },
  // Items bought by Sam (sold, belong to other sellers)
  {
    id: "l_bought_highchair", sellerId: "u_elijah", title: "Bumbo floor seat with tray", brand: "Bumbo",
    description: "Teal.", category: "toys", condition: "good", ageGroup: "3-6m", price: 30, location: LOC.parramatta,
    delivery: { post: { satchel: "L" }, pickup: true, meetup: true }, recallStatus: "no_recalls", status: "sold", views: 40, saves: 2, daysAgo: 20,
  },
  {
    id: "l_bought_sleepsuit", sellerId: "u_priya", title: "ergoPouch sleep suit bundle — size 1, 3 items", brand: "ergoPouch",
    description: "1.0 and 2.5 TOG.", category: "clothing", condition: "good", ageGroup: "12-24m", size: "1", gender: "unisex", price: 60,
    location: LOC.hornsby, isBundle: true, bundleItemCount: 3, delivery: { post: { satchel: "M" }, pickup: true, meetup: false },
    recallStatus: "not_checked", status: "sold", views: 70, saves: 9, daysAgo: 12,
  },
  {
    id: "l_bought_pram", sellerId: "u_oliver", title: "Joolz Aer+ compact stroller", brand: "Joolz", model: "Aer+",
    description: "Lightweight stroller.", category: "prams", condition: "like_new", ageGroup: "6-12m", price: 450, location: LOC.dural,
    isLargeItem: true, delivery: { pickup: true, meetup: true }, safety: safetyFor("prams"), recallStatus: "no_recalls",
    status: "sold", views: 120, saves: 10, daysAgo: 6,
  },
  {
    id: "l_bought_books", sellerId: "u_grace", title: "Julia Donaldson picture book set × 8", brand: "Macmillan",
    description: "Gruffalo, Room on the Broom and more.", category: "books", condition: "good", ageGroup: "3-5y", price: 40,
    location: LOC.brunswick, isBundle: true, bundleItemCount: 8, delivery: { post: { satchel: "M" }, pickup: true, meetup: false },
    recallStatus: "not_checked", status: "sold", views: 50, saves: 4, daysAgo: 9,
  },
  {
    id: "l_bought_monitor", sellerId: "u_jack", title: "Nanit Pro baby monitor with floor stand", brand: "Nanit", model: "Pro",
    description: "Camera with floor stand and breathing band.", category: "bath", condition: "good", ageGroup: "all", price: 220,
    location: LOC.manly, delivery: { post: { satchel: "L" }, pickup: true, meetup: true }, recallStatus: "no_recalls", status: "sold",
    views: 90, saves: 6, daysAgo: 15,
  },
  {
    id: "l_bought_toys", sellerId: "u_mia", title: "Wooden stacking rainbow + shape sorter", brand: "Grimm's",
    description: "Classic wooden toys.", category: "toys", condition: "like_new", ageGroup: "12-24m", price: 70, location: LOC.newtown,
    delivery: { post: { satchel: "L" }, pickup: true, meetup: true }, recallStatus: "not_checked", status: "sold", views: 44, saves: 5, daysAgo: 3,
  },
  {
    id: "l_bought_cancel", sellerId: "u_noah", title: "Tula toddler carrier", brand: "Tula",
    description: "Standard toddler carrier.", category: "carriers", condition: "good", ageGroup: "12-24m", price: 95, location: LOC.paddington,
    delivery: { post: { satchel: "M" }, pickup: true, meetup: true }, safety: safetyFor("carriers"), recallStatus: "not_checked",
    views: 30, saves: 2, daysAgo: 18,
  },
];

const listings: Listing[] = raw.map(({ daysAgo, nPhotos = 2, ...l }) => ({
  ...l,
  isLargeItem: l.isLargeItem ?? false,
  status: l.status ?? "active",
  recallStatus: l.recallStatus ?? "not_checked",
  photos: photos(l.category, nPhotos, l.title),
  createdAt: ago(daysAgo, 3),
  updatedAt: ago(daysAgo),
  boostedUntil: l.id === "l_bugaboo_fox" ? ahead(2) : undefined,
}));

const byId = (id: string) => listings.find((l) => l.id === id)!;

function orderFrom(
  id: string,
  number: string,
  listingId: string,
  buyerId: string,
  status: Order["status"],
  method: Order["method"],
  daysAgo: number,
  extra: Partial<Order> = {},
): Order {
  const l = byId(listingId);
  const pricing = priceOrder([{ ...l, effectivePrice: l.price }], method, { distanceKm: 25, sellerSuburb: l.location.suburb });
  return {
    id,
    number,
    buyerId,
    sellerId: l.sellerId,
    items: [{ listingId: l.id, title: l.title, brand: l.brand, category: l.category, size: l.size, photo: l.photos[0], price: l.price }],
    method,
    pricing,
    status,
    history: [
      { at: ago(daysAgo, 2), status: "pending_payment" },
      { at: ago(daysAgo, 1), status: "paid_in_escrow" },
      ...(extra.history ?? []),
    ],
    createdAt: ago(daysAgo, 2),
    updatedAt: ago(Math.max(0, daysAgo - 1)),
    ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== "history")),
  } as Order;
}

const orders: Order[] = [
  // Sam buying
  orderFrom("o_1001", "KD-1001", "l_bought_highchair", "u_sam", "completed", "post", 20, {
    history: [
      { at: ago(19), status: "shipped" },
      { at: ago(17), status: "delivered" },
      { at: ago(16), status: "completed" },
    ],
    shipment: { carrier: "AusPost", trackingNumber: "33XYZ0001234", shippedAt: ago(19), deliveredAt: ago(17) },
    buyerReviewed: true,
  }),
  orderFrom("o_1002", "KD-1002", "l_bought_sleepsuit", "u_sam", "shipped", "post", 3, {
    history: [{ at: ago(2), status: "shipped" }],
    shipment: { carrier: "AusPost", trackingNumber: "33XYZ0005678", shippedAt: ago(2) },
  }),
  orderFrom("o_1003", "KD-1003", "l_bought_pram", "u_sam", "ready_for_handover", "pickup", 1, {
    history: [{ at: ago(0, 20), status: "ready_for_handover" }],
    handover: { code: "482913", qrPayload: "kindo:handover:o_1003:482913", scheduledFor: ahead(1), meetingPoint: "Dural — front of Round Corner shops" },
  }),
  orderFrom("o_1004", "KD-1004", "l_bought_books", "u_sam", "delivered", "post", 6, {
    history: [
      { at: ago(5), status: "shipped" },
      { at: ago(1), status: "delivered" },
    ],
    shipment: { carrier: "AusPost", trackingNumber: "33XYZ0009012", shippedAt: ago(5), deliveredAt: ago(1), autoConfirmAt: ahead(AUTO_CONFIRM_DAYS - 1) },
  }),
  orderFrom("o_1005", "KD-1005", "l_bought_monitor", "u_sam", "disputed", "post", 10, {
    history: [
      { at: ago(9), status: "shipped" },
      { at: ago(7), status: "delivered" },
      { at: ago(6), status: "disputed", note: "Buyer raised an issue: not as described" },
    ],
    shipment: { carrier: "AusPost", trackingNumber: "33XYZ0003456", shippedAt: ago(9), deliveredAt: ago(7) },
    disputeId: "d_1",
  }),
  orderFrom("o_1006", "KD-1006", "l_bought_toys", "u_sam", "paid_in_escrow", "post", 0),
  orderFrom("o_1007", "KD-1007", "l_bought_cancel", "u_sam", "refunded", "meetup", 18, {
    history: [
      { at: ago(17), status: "ready_for_handover" },
      { at: ago(16), status: "cancelled", note: "Seller didn't show for the meetup" },
      { at: ago(16), status: "refunded" },
    ],
    refundAmount: 0,
  }),
  // Sam selling
  orderFrom("o_2001", "KD-2001", "l_sam_bouncer", "u_mia", "completed", "post", 30, {
    history: [
      { at: ago(29), status: "shipped" },
      { at: ago(27), status: "delivered" },
      { at: ago(26), status: "completed" },
    ],
    shipment: { carrier: "AusPost", trackingNumber: "33XYZ0007777", shippedAt: ago(29), deliveredAt: ago(27) },
    sellerReviewed: true,
    buyerReviewed: true,
  }),
  orderFrom("o_2002", "KD-2002", "l_sam_cot", "u_noah", "ready_for_handover", "pickup", 1, {
    history: [{ at: ago(0, 22), status: "ready_for_handover" }],
    handover: { code: "715204", qrPayload: "kindo:handover:o_2002:715204", scheduledFor: ahead(0, 26), meetingPoint: "Pickup in Castle Hill" },
  }),
  orderFrom("o_2003", "KD-2003", "l_sam_carrier_sold", "u_grace", "partially_refunded", "post", 45, {
    history: [
      { at: ago(44), status: "shipped" },
      { at: ago(42), status: "delivered" },
      { at: ago(41), status: "disputed" },
      { at: ago(38), status: "partially_refunded", note: "Kindo refunded $10 for a missing insert" },
    ],
    refundAmount: 10,
    shipment: { carrier: "AusPost", trackingNumber: "33XYZ0002222", shippedAt: ago(44), deliveredAt: ago(42) },
  }),
  orderFrom("o_2004", "KD-2004", "l_nike_tee", "u_jack", "pending_payment", "post", 0, { history: [] }),
  orderFrom("o_2005", "KD-2005", "l_jellycat", "u_elijah", "cancelled", "post", 9, {
    history: [{ at: ago(8), status: "cancelled", note: "Buyer cancelled before payment" }],
  }),
];
// pending/cancelled-before-payment orders shouldn't claim they were paid
for (const o of orders) {
  if (o.status === "pending_payment") o.history = [{ at: o.createdAt, status: "pending_payment" }];
  if (o.id === "o_2005") o.history = [{ at: o.createdAt, status: "pending_payment" }, { at: ago(8), status: "cancelled", note: "Buyer cancelled before payment" }];
}
const o1007 = orders.find((o) => o.id === "o_1007")!;
o1007.refundAmount = o1007.pricing.total;

const disputes: Dispute[] = [
  {
    id: "d_1", caseNumber: "CASE-0042", orderId: "o_1005", buyerId: "u_sam", sellerId: "u_jack", reason: "not_as_described",
    details: "Listing said the floor stand was included but it wasn't in the box. Camera works fine.",
    sellerResponse: "I thought I packed it — happy to post it separately.", status: "needs_ruling", openedAt: ago(6),
  },
  {
    id: "d_0", caseNumber: "CASE-0031", orderId: "o_2003", buyerId: "u_grace", sellerId: "u_sam", reason: "not_as_described",
    details: "Newborn insert missing.", sellerResponse: "Sorry — it must have been left behind.", status: "resolved",
    outcome: "partial_refund", refundAmount: 10, adminNote: "Partial refund for missing accessory.", openedAt: ago(41), resolvedAt: ago(38),
  },
];

const reports: Report[] = [
  {
    id: "r_1", listingId: "l_maxi_capsule", reporterId: "u_grace", reason: "recalled_item",
    details: "This capsule model was manufactured in 2015 — it looks expired and there was a recall notice.", status: "open", createdAt: ago(1),
  },
  {
    id: "r_2", listingId: "l_babyzen", reporterId: "u_elijah", reason: "misleading", details: "Photos look like stock images.",
    status: "dismissed", action: "dismissed", createdAt: ago(5), resolvedAt: ago(4),
  },
];

const reviews: Review[] = [
  { id: "rv_1", orderId: "o_1001", authorId: "u_sam", subjectId: "u_elijah", role: "buyer", rating: 5, comment: "Fast postage and exactly as described.", createdAt: ago(16) },
  { id: "rv_2", orderId: "o_2001", authorId: "u_mia", subjectId: "u_sam", role: "buyer", rating: 5, comment: "Lovely seller, bouncer was spotless.", createdAt: ago(26) },
  { id: "rv_3", orderId: "o_2001", authorId: "u_sam", subjectId: "u_mia", role: "seller", rating: 5, comment: "Quick payment, easy to deal with.", createdAt: ago(26) },
  { id: "rv_4", orderId: "x_1", authorId: "u_priya", subjectId: "u_oliver", role: "buyer", rating: 5, comment: "Pram was in better condition than the photos!", createdAt: ago(40) },
  { id: "rv_5", orderId: "x_2", authorId: "u_grace", subjectId: "u_oliver", role: "buyer", rating: 5, comment: "Friendly handover, QR made it easy.", createdAt: ago(55) },
  { id: "rv_6", orderId: "x_3", authorId: "u_noah", subjectId: "u_priya", role: "buyer", rating: 5, comment: "Beautifully packed bundle.", createdAt: ago(20) },
  { id: "rv_7", orderId: "x_4", authorId: "u_elijah", subjectId: "u_sam", role: "buyer", rating: 4, comment: "Good communication, slightly slow to post.", createdAt: ago(70) },
];

const conversations: Conversation[] = [
  { id: "c_1", listingId: "l_vista_v2", participantIds: ["u_sam", "u_oliver"], lastMessageAt: ago(0, 1), unreadCount: 1 },
  { id: "c_2", listingId: "l_nike_tee", participantIds: ["u_sam", "u_jack"], lastMessageAt: ago(0, 5), unreadCount: 1 },
  { id: "c_3", listingId: "l_bought_pram", participantIds: ["u_sam", "u_oliver"], lastMessageAt: ago(1), unreadCount: 0 },
];

const offers: Offer[] = [
  {
    id: "of_1", listingId: "l_vista_v2", buyerId: "u_sam", sellerId: "u_oliver", amount: 580, fromUserId: "u_sam",
    status: "countered", expiresAt: ahead(0, 20), createdAt: ago(0, 4),
  },
  {
    id: "of_2", listingId: "l_vista_v2", buyerId: "u_sam", sellerId: "u_oliver", amount: 620, fromUserId: "u_oliver",
    status: "pending", previousOfferId: "of_1", expiresAt: ahead(0, OFFER_EXPIRY_HOURS - 1), createdAt: ago(0, 1),
  },
  {
    id: "of_3", listingId: "l_nike_tee", buyerId: "u_jack", sellerId: "u_sam", amount: 22, fromUserId: "u_jack",
    status: "pending", expiresAt: ahead(0, 19), createdAt: ago(0, 5),
  },
];

const messages: Message[] = [
  { id: "m_1", conversationId: "c_1", senderId: "u_sam", body: "Hi Oliver! Is the rain cover included?", sentAt: ago(0, 6) },
  { id: "m_2", conversationId: "c_1", senderId: "u_oliver", body: "Hi Sam, yes — rain cover and cup holder are both included.", sentAt: ago(0, 5) },
  { id: "m_3", conversationId: "c_1", senderId: "u_sam", body: "", offerId: "of_1", sentAt: ago(0, 4) },
  { id: "m_4", conversationId: "c_1", senderId: "u_oliver", body: "", offerId: "of_2", sentAt: ago(0, 1) },
  { id: "m_5", conversationId: "c_2", senderId: "u_jack", body: "Would you take $22 for the tee?", sentAt: ago(0, 5) },
  { id: "m_6", conversationId: "c_2", senderId: "u_jack", body: "", offerId: "of_3", sentAt: ago(0, 5) },
  { id: "m_7", conversationId: "c_3", senderId: "u_oliver", body: "Thanks for buying! I'm free tomorrow from 10am at the Round Corner shops in Dural.", sentAt: ago(1, 2) },
  { id: "m_8", conversationId: "c_3", senderId: "u_sam", body: "Perfect, see you at 10.", sentAt: ago(1) },
  { id: "m_9", conversationId: "c_3", senderId: "system", body: "Order KD-1003 is ready for pickup. Inspect the item, then scan the seller's QR code to release payment.", system: true, sentAt: ago(0, 20) },
];

const notifications: Notification[] = [
  { id: "n_1", userId: "u_sam", kind: "offer", title: "Oliver countered your offer", body: "$620 for UPPAbaby Vista V2 — expires in 23 h", href: "/messages/c_1", read: false, createdAt: ago(0, 1) },
  { id: "n_2", userId: "u_sam", kind: "price_drop", title: "Price drop on a saved item", body: "UPPAbaby Vista V2 is now $650 (was $720)", href: "/listing/l_vista_v2", read: false, createdAt: ago(0, 3) },
  { id: "n_3", userId: "u_sam", kind: "saved_search", title: "New match: Bugaboo under $900", body: "Bugaboo Fox 3 complete — $890 · Brunswick", href: "/listing/l_bugaboo_fox", read: false, createdAt: ago(1) },
  { id: "n_4", userId: "u_sam", kind: "order", title: "Your order is ready for pickup", body: "Joolz Aer+ — meet Oliver in Dural", href: "/orders/o_1003", read: true, createdAt: ago(0, 20) },
  { id: "n_5", userId: "u_sam", kind: "payout", title: "Payment released", body: "$140.00 for BabyBjörn Bouncer Bliss", href: "/profile/wallet", read: true, createdAt: ago(26) },
];

const savedItems: SavedItem[] = [
  { listingId: "l_vista_v2", userId: "u_sam", priceAtSave: 720, priceDropAlert: true, savedAt: ago(7) },
  { listingId: "l_snoo", userId: "u_sam", priceAtSave: 1100, priceDropAlert: true, savedAt: ago(3) },
  { listingId: "l_lovevery", userId: "u_sam", priceAtSave: 150, priceDropAlert: false, savedAt: ago(2) },
];

const savedSearches: SavedSearch[] = [
  { id: "ss_1", userId: "u_sam", label: "Bugaboo under $900 within 50 km", query: { q: "Bugaboo", category: "prams", maxPrice: 900, radiusKm: 50 }, notify: true, createdAt: ago(10), lastMatchCount: 1 },
  { id: "ss_2", userId: "u_sam", label: "Size 1 clothing", query: { category: "clothing", q: "size 1" }, notify: false, createdAt: ago(20) },
];

const children: Child[] = [
  { id: "ch_1", parentId: "u_sam", nickname: "Ivy", birthDate: new Date(Date.now() - 200 * DAY).toISOString() },
];

const payouts: Payout[] = [
  { id: "po_1", sellerId: "u_sam", orderId: "o_2001", amount: 140, status: "paid", createdAt: ago(26), paidAt: ago(24) },
  { id: "po_2", sellerId: "u_sam", orderId: "o_2003", amount: 30, status: "paid", createdAt: ago(38), paidAt: ago(36) },
  { id: "po_3", sellerId: "u_sam", orderId: "o_2002", amount: 150, status: "held", createdAt: ago(1) },
];

const payoutAccount: PayoutAccount = { status: "active", bankLast4: "4821" };

const subscription: Subscription = { userId: "u_sam", plan: "free", status: "none", boostsRemaining: 0 };

export interface MockDB {
  version: number;
  users: User[];
  listings: Listing[];
  orders: Order[];
  disputes: Dispute[];
  reports: Report[];
  reviews: Review[];
  conversations: Conversation[];
  messages: Message[];
  offers: Offer[];
  notifications: Notification[];
  savedItems: SavedItem[];
  savedSearches: SavedSearch[];
  children: Child[];
  payouts: Payout[];
  payoutAccount: PayoutAccount;
  subscription: Subscription;
  cart: { items: { listingId: string; addedAt: string; offerPrice?: number }[]; deliveryBySeller: Record<string, Order["method"]> };
  drafts: Record<string, unknown>;
  recentlyViewed: string[];
}

export const DB_VERSION = 3;

export function createSeed(): MockDB {
  return structuredClone({
    version: DB_VERSION,
    users,
    listings,
    orders,
    disputes,
    reports,
    reviews,
    conversations,
    messages,
    offers,
    notifications,
    savedItems,
    savedSearches,
    children,
    payouts,
    payoutAccount,
    subscription,
    cart: { items: [], deliveryBySeller: {} },
    drafts: {},
    recentlyViewed: [],
  });
}
