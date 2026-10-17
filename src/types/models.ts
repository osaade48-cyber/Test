/**
 * Kindo data model — the single source of truth for shapes passed between the
 * service layer and the UI. The real backend should return these shapes.
 *
 * Conventions: ids are strings, money is AUD as a number (dollars), dates are
 * ISO-8601 strings. Format them for humans with lib/format.ts.
 */

export type ID = string;
export type ISODate = string;

// ─── Taxonomy ──────────────────────────────────────────────────────────────

export type CategoryId =
  | "clothing"
  | "prams"
  | "car-seats"
  | "nursery"
  | "high-chairs"
  | "feeding"
  | "carriers"
  | "toys"
  | "books"
  | "bath";

export type AgeGroup = "newborn" | "3-6m" | "6-12m" | "12-24m" | "2-3y" | "3-5y" | "5-8y" | "8y+" | "all";

export type Condition = "new_with_tags" | "like_new" | "good" | "fair";

export type Gender = "girls" | "boys" | "unisex";

export type SatchelSize = "S" | "M" | "L" | "XL";

// ─── People ────────────────────────────────────────────────────────────────

export type TrustTier = "new" | "trusted" | "verified" | "pro";

export interface Location {
  suburb: string;
  state: "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";
  postcode: string;
  /** Approximate centroid of the suburb — never a street address. */
  lat: number;
  lng: number;
}

export interface User {
  id: ID;
  name: string;
  avatarColor: string;
  email?: string;
  location: Location;
  joinedAt: ISODate;
  isAdmin?: boolean;
  isPro?: boolean;
  trustTier: TrustTier;
  idVerified?: boolean;
  rating: number | null;
  reviewCount: number;
  completedSales: number;
  /** Median hours to first reply. */
  responseTimeHours: number | null;
  bio?: string;
  status?: "active" | "warned" | "suspended";
}

export interface Child {
  id: ID;
  parentId: ID;
  nickname: string;
  /** Exactly one of these is set. */
  birthDate?: ISODate;
  dueDate?: ISODate;
}

// ─── Listings ──────────────────────────────────────────────────────────────

export interface ListingPhoto {
  id: ID;
  /** URL, data URL, or `mock:<category>:<variant>` for seed placeholders. */
  url: string;
  alt: string;
}

export interface SafetyAnswer {
  questionId: string;
  question: string;
  answer: boolean;
}

export interface SafetyDeclaration {
  completed: boolean;
  completedAt?: ISODate;
  answers: SafetyAnswer[];
  /** Car seats only. */
  manufactureDate?: ISODate;
  expiryDate?: ISODate;
}

export type RecallStatus = "not_checked" | "no_recalls" | "recall_notice";

export interface DeliveryOptions {
  /** Satchel the seller will use. Never set for large items. */
  post?: { satchel: SatchelSize };
  /** Large items only: courier quote calculated at checkout. */
  largeCalculated?: boolean;
  pickup: boolean;
  meetup: boolean;
}

export type DeliveryMethod = "post" | "large_calculated" | "pickup" | "meetup";

export type ListingStatus = "draft" | "active" | "reserved" | "sold" | "archived" | "removed";

export interface Listing {
  id: ID;
  sellerId: ID;
  title: string;
  brand: string;
  model?: string;
  description: string;
  category: CategoryId;
  condition: Condition;
  ageGroup: AgeGroup;
  size?: string;
  gender?: Gender;
  price: number;
  /** Set when the price has been reduced. */
  originalPrice?: number;
  photos: ListingPhoto[];
  isLargeItem: boolean;
  isBundle?: boolean;
  bundleItemCount?: number;
  delivery: DeliveryOptions;
  location: Location;
  safety?: SafetyDeclaration;
  recallStatus: RecallStatus;
  status: ListingStatus;
  views: number;
  saves: number;
  boostedUntil?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type ListingDraft = Partial<Omit<Listing, "id" | "sellerId" | "status" | "views" | "saves" | "createdAt" | "updatedAt">> & {
  id?: ID;
  step?: 1 | 2 | 3;
};

export interface ListingQuery {
  q?: string;
  category?: CategoryId;
  ageGroups?: AgeGroup[];
  conditions?: Condition[];
  gender?: Gender;
  minPrice?: number;
  maxPrice?: number;
  radiusKm?: number;
  delivery?: "post" | "pickup";
  freeShipping?: boolean;
  sellerId?: ID;
  sort?: "newest" | "price_asc" | "price_desc" | "nearest";
  status?: ListingStatus | "all";
  limit?: number;
}

// ─── Cart ──────────────────────────────────────────────────────────────────

export interface CartItem {
  listingId: ID;
  addedAt: ISODate;
  /** Agreed offer price, if any. */
  offerPrice?: number;
}

export interface Cart {
  items: CartItem[];
  /** Chosen delivery method per seller. */
  deliveryBySeller: Record<ID, DeliveryMethod>;
}

/** A cart grouped by seller, with honest pricing per group. */
export interface SellerBundle {
  seller: User;
  listings: (Listing & { effectivePrice: number })[];
  method: DeliveryMethod;
  availableMethods: DeliveryMethod[];
  pricing: OrderPricing;
}

export interface OrderPricing {
  itemSubtotal: number;
  postage: number | null; // null = not yet known
  postageLabel: string;
  freeShipping: boolean;
  buyerFee: number;
  total: number;
  /** Amount needed from this seller to reach free shipping, if applicable. */
  freeShippingGap?: number;
}

// ─── Orders ────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending_payment"
  | "paid_in_escrow"
  | "shipped"
  | "delivered"
  | "ready_for_handover"
  | "completed"
  | "cancelled"
  | "disputed"
  | "refunded"
  | "partially_refunded";

export interface OrderItem {
  listingId: ID;
  title: string;
  brand: string;
  category: CategoryId;
  size?: string;
  photo: ListingPhoto;
  price: number;
}

export interface Shipment {
  carrier: string;
  trackingNumber: string;
  shippedAt: ISODate;
  deliveredAt?: ISODate;
  autoConfirmAt?: ISODate;
}

export interface Handover {
  /** 6-digit backup code. In production only the seller's device should ever see it. */
  code: string;
  qrPayload: string;
  scheduledFor?: ISODate;
  meetingPoint?: string;
  confirmedAt?: ISODate;
}

export interface OrderEvent {
  at: ISODate;
  status: OrderStatus;
  note?: string;
}

export interface Order {
  id: ID;
  number: string;
  buyerId: ID;
  sellerId: ID;
  items: OrderItem[];
  method: DeliveryMethod;
  pricing: OrderPricing;
  status: OrderStatus;
  history: OrderEvent[];
  shipment?: Shipment;
  handover?: Handover;
  disputeId?: ID;
  refundAmount?: number;
  buyerReviewed?: boolean;
  sellerReviewed?: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ─── Offers ────────────────────────────────────────────────────────────────

export type OfferStatus = "pending" | "countered" | "accepted" | "declined" | "expired" | "withdrawn";

export interface Offer {
  id: ID;
  listingId: ID;
  buyerId: ID;
  sellerId: ID;
  amount: number;
  /** Who made this amount. */
  fromUserId: ID;
  status: OfferStatus;
  previousOfferId?: ID;
  expiresAt: ISODate;
  createdAt: ISODate;
}

// ─── Disputes & moderation ─────────────────────────────────────────────────

export type DisputeReason = "not_as_described" | "not_received" | "damaged" | "safety_concern" | "other";
export type DisputeStatus = "needs_ruling" | "resolved";
export type DisputeOutcome = "refund_buyer" | "release_to_seller" | "partial_refund";

export interface Dispute {
  id: ID;
  caseNumber: string;
  orderId: ID;
  buyerId: ID;
  sellerId: ID;
  reason: DisputeReason;
  details: string;
  sellerResponse?: string;
  status: DisputeStatus;
  outcome?: DisputeOutcome;
  refundAmount?: number;
  adminNote?: string;
  openedAt: ISODate;
  resolvedAt?: ISODate;
}

export type ReportReason = "prohibited_item" | "recalled_item" | "misleading" | "scam" | "offensive" | "other";

export interface Report {
  id: ID;
  listingId: ID;
  reporterId: ID;
  reason: ReportReason;
  details: string;
  status: "open" | "actioned" | "dismissed";
  action?: "listing_removed" | "user_warned" | "user_suspended" | "dismissed";
  createdAt: ISODate;
  resolvedAt?: ISODate;
}

// ─── Reviews ───────────────────────────────────────────────────────────────

export interface Review {
  id: ID;
  orderId: ID;
  authorId: ID;
  subjectId: ID;
  role: "buyer" | "seller"; // role of the author
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: ISODate;
}

// ─── Messages ──────────────────────────────────────────────────────────────

export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  body: string;
  offerId?: ID;
  /** System messages (order updates) have no human sender. */
  system?: boolean;
  sentAt: ISODate;
}

export interface Conversation {
  id: ID;
  listingId: ID;
  participantIds: [ID, ID];
  lastMessageAt: ISODate;
  unreadCount: number;
}

// ─── Notifications & alerts ────────────────────────────────────────────────

export type NotificationKind =
  | "message"
  | "offer"
  | "order"
  | "saved_search"
  | "price_drop"
  | "review"
  | "payout"
  | "system";

export interface Notification {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: ISODate;
}

export interface SavedSearch {
  id: ID;
  userId: ID;
  label: string;
  query: ListingQuery;
  notify: boolean;
  createdAt: ISODate;
  lastMatchCount?: number;
}

export interface SavedItem {
  listingId: ID;
  userId: ID;
  /** Price when saved — used for price-drop alerts. */
  priceAtSave: number;
  priceDropAlert: boolean;
  savedAt: ISODate;
}

// ─── Money ─────────────────────────────────────────────────────────────────

export interface Payout {
  id: ID;
  sellerId: ID;
  orderId: ID;
  amount: number;
  status: "held" | "available" | "paid" | "reversed";
  createdAt: ISODate;
  paidAt?: ISODate;
}

export interface PayoutAccount {
  /** TODO(stripe): Stripe Connect account state. */
  status: "not_started" | "pending_verification" | "active";
  bankLast4?: string;
}

export interface Subscription {
  userId: ID;
  plan: "free" | "pro_monthly" | "pro_annual";
  status: "active" | "cancelled" | "past_due" | "none";
  renewsAt?: ISODate;
  boostsRemaining: number;
}

// ─── Platform ──────────────────────────────────────────────────────────────

export interface PlatformStats {
  activeListings: number;
  sellers: number;
  averageRating: number | null;
  reviewCount: number;
}
