/**
 * Conversations, messages and offers.
 * TODO(api): realtime delivery (websocket / push) instead of polling.
 */
import type { Conversation, Listing, Message, Offer, User } from "@/types/models";
import { OFFER_EXPIRY_HOURS } from "@/config/business";
import { uid } from "@/lib/id";
import { formatMoney } from "@/lib/format";
import { db, latency, nowIso, persist, ServiceError } from "./mock/db";
import { currentUserId, requireUserId } from "./auth";
import { emit } from "./events";
import { addToCart } from "./cart";

export interface ConversationSummary extends Conversation {
  other: User;
  listing: Listing;
  lastMessage?: Message;
}

export interface ConversationThread extends ConversationSummary {
  messages: Message[];
  offers: Offer[];
}

function expireOffers() {
  const now = Date.now();
  for (const o of db.offers) {
    if (o.status === "pending" && new Date(o.expiresAt).getTime() < now) o.status = "expired";
  }
}

export function unreadMessagesSync(): number {
  const me = currentUserId();
  return me ? db.conversations.filter((c) => c.participantIds.includes(me)).reduce((s, c) => s + c.unreadCount, 0) : 0;
}

function summarise(c: Conversation, me: string): ConversationSummary {
  const otherId = c.participantIds.find((p) => p !== me)!;
  const msgs = db.messages.filter((m) => m.conversationId === c.id);
  return {
    ...c,
    other: db.users.find((u) => u.id === otherId)!,
    listing: db.listings.find((l) => l.id === c.listingId)!,
    lastMessage: msgs[msgs.length - 1],
  };
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const me = requireUserId();
  expireOffers();
  return latency(
    db.conversations
      .filter((c) => c.participantIds.includes(me))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .map((c) => summarise(c, me)),
  );
}

export async function getThread(id: string): Promise<ConversationThread> {
  const me = requireUserId();
  expireOffers();
  const c = db.conversations.find((x) => x.id === id && x.participantIds.includes(me));
  if (!c) throw new ServiceError("Conversation not found", "not_found");
  c.unreadCount = 0;
  persist();
  emit("messages");
  return latency({
    ...summarise(c, me),
    messages: db.messages.filter((m) => m.conversationId === id).sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    offers: db.offers.filter((o) => o.listingId === c.listingId && (o.buyerId === me || o.sellerId === me)),
  });
}

/** Find or create the conversation about a listing with its seller. */
export async function openConversation(listingId: string): Promise<string> {
  const me = requireUserId();
  const l = db.listings.find((x) => x.id === listingId);
  if (!l) throw new ServiceError("Listing not found", "not_found");
  if (l.sellerId === me) throw new ServiceError("This is your own listing.", "own_listing");
  let c = db.conversations.find((x) => x.listingId === listingId && x.participantIds.includes(me));
  if (!c) {
    c = { id: uid("c"), listingId, participantIds: [me, l.sellerId], lastMessageAt: nowIso(), unreadCount: 0 };
    db.conversations.push(c);
    persist();
  }
  return latency(c.id);
}

export async function sendMessage(conversationId: string, body: string): Promise<Message> {
  const me = requireUserId();
  const c = db.conversations.find((x) => x.id === conversationId);
  if (!c) throw new ServiceError("Conversation not found", "not_found");
  const m: Message = { id: uid("m"), conversationId, senderId: me, body: body.trim(), sentAt: nowIso() };
  db.messages.push(m);
  c.lastMessageAt = m.sentAt;
  persist();
  emit("messages");
  return latency(m);
}

// ─── Offers ────────────────────────────────────────────────────────────────

const expiry = () => new Date(Date.now() + OFFER_EXPIRY_HOURS * 36e5).toISOString();

function pushOfferMessage(conversationId: string, offer: Offer) {
  db.messages.push({ id: uid("m"), conversationId, senderId: offer.fromUserId, body: "", offerId: offer.id, sentAt: offer.createdAt });
  const c = db.conversations.find((x) => x.id === conversationId)!;
  c.lastMessageAt = offer.createdAt;
}

export async function makeOffer(listingId: string, amount: number): Promise<{ conversationId: string; offer: Offer }> {
  const me = requireUserId();
  const l = db.listings.find((x) => x.id === listingId && x.status === "active");
  if (!l) throw new ServiceError("This item is no longer available.", "unavailable");
  if (amount <= 0 || amount >= l.price) throw new ServiceError(`Offers must be under the asking price of ${formatMoney(l.price)}.`, "invalid");
  const conversationId = await openConversation(listingId);
  // withdraw any previous pending offer from me
  db.offers.forEach((o) => o.listingId === listingId && o.buyerId === me && o.status === "pending" && (o.status = "withdrawn"));
  const offer: Offer = {
    id: uid("of"), listingId, buyerId: me, sellerId: l.sellerId, amount, fromUserId: me, status: "pending", expiresAt: expiry(), createdAt: nowIso(),
  };
  db.offers.push(offer);
  pushOfferMessage(conversationId, offer);
  db.notifications.unshift({
    id: uid("n"), userId: l.sellerId, kind: "offer", title: "New offer", body: `${formatMoney(amount)} for ${l.title}`,
    href: `/messages/${conversationId}`, read: false, createdAt: nowIso(),
  });
  persist();
  emit("messages", "notifications");
  return latency({ conversationId, offer });
}

function findOffer(id: string, me: string) {
  expireOffers();
  const o = db.offers.find((x) => x.id === id);
  if (!o || (o.buyerId !== me && o.sellerId !== me)) throw new ServiceError("Offer not found", "not_found");
  if (o.status !== "pending") throw new ServiceError(`This offer is ${o.status}.`, "invalid");
  if (o.fromUserId === me) throw new ServiceError("Waiting for the other person to respond.", "invalid");
  return o;
}

export async function counterOffer(offerId: string, amount: number): Promise<Offer> {
  const me = requireUserId();
  const prev = findOffer(offerId, me);
  const l = db.listings.find((x) => x.id === prev.listingId)!;
  if (amount <= 0 || amount > l.price) throw new ServiceError("Enter an amount up to the asking price.", "invalid");
  prev.status = "countered";
  const next: Offer = { ...prev, id: uid("of"), amount, fromUserId: me, status: "pending", previousOfferId: prev.id, expiresAt: expiry(), createdAt: nowIso() };
  db.offers.push(next);
  const conv = db.conversations.find((c) => c.listingId === prev.listingId && c.participantIds.includes(prev.buyerId))!;
  pushOfferMessage(conv.id, next);
  persist();
  emit("messages");
  return latency(next);
}

/**
 * Accept an offer. If the buyer accepts (a counter), the item goes straight to
 * their bundle at the agreed price; if the seller accepts, the buyer is
 * notified to check out.
 */
export async function acceptOffer(offerId: string): Promise<{ offer: Offer; checkoutReady: boolean }> {
  const me = requireUserId();
  const o = findOffer(offerId, me);
  o.status = "accepted";
  const conv = db.conversations.find((c) => c.listingId === o.listingId && c.participantIds.includes(o.buyerId))!;
  db.messages.push({
    id: uid("m"), conversationId: conv.id, senderId: "system", system: true, sentAt: nowIso(),
    body: `Offer of ${formatMoney(o.amount)} accepted. The buyer can now check out at this price.`,
  });
  persist();
  if (me === o.buyerId) await addToCart(o.listingId, o.amount);
  else {
    // TODO(api): server adds to buyer's cart; mock does it directly.
    if (!db.cart.items.some((i) => i.listingId === o.listingId) && o.buyerId === currentUserId()) {
      db.cart.items.push({ listingId: o.listingId, addedAt: nowIso(), offerPrice: o.amount });
    }
    db.notifications.unshift({
      id: uid("n"), userId: o.buyerId, kind: "offer", title: "Offer accepted", body: `Check out now for ${formatMoney(o.amount)}`,
      href: `/messages/${conv.id}`, read: false, createdAt: nowIso(),
    });
  }
  persist();
  emit("messages", "cart", "notifications");
  return latency({ offer: o, checkoutReady: me === o.buyerId });
}

export async function declineOffer(offerId: string): Promise<Offer> {
  const me = requireUserId();
  const o = findOffer(offerId, me);
  o.status = "declined";
  persist();
  emit("messages");
  return latency(o);
}

export async function getAcceptedOfferPrice(listingId: string): Promise<number | null> {
  const me = currentUserId();
  const o = db.offers.find((x) => x.listingId === listingId && x.buyerId === me && x.status === "accepted");
  return latency(o ? o.amount : null);
}
