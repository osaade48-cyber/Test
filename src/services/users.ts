/** Users, public profiles, reviews and platform stats. */
import type { PlatformStats, Review, User } from "@/types/models";
import { computeTier } from "@/lib/trust";
import { db, latency, persist, ServiceError } from "./mock/db";
import { requireUserId } from "./auth";
import { emit } from "./events";
import { searchListings, type ListingWithMeta } from "./listings";

export interface ReviewWithAuthor extends Review {
  author: User;
}

export interface PublicProfile {
  user: User;
  listings: ListingWithMeta[];
  reviews: ReviewWithAuthor[];
}

export function userSync(id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}

export async function getUser(id: string): Promise<User> {
  const u = db.users.find((x) => x.id === id);
  if (!u) throw new ServiceError("User not found", "not_found");
  return latency({ ...u, trustTier: computeTier(u) });
}

export async function getPublicProfile(id: string): Promise<PublicProfile> {
  const user = await getUser(id);
  const listings = await searchListings({ sellerId: id });
  const reviews = db.reviews
    .filter((r) => r.subjectId === id)
    .map((r) => ({ ...r, author: db.users.find((u) => u.id === r.authorId)! }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return latency({ user, listings, reviews });
}

export async function updateProfile(patch: Partial<Pick<User, "name" | "bio" | "location">>): Promise<User> {
  const me = requireUserId();
  const u = db.users.find((x) => x.id === me)!;
  Object.assign(u, patch);
  persist();
  emit("auth");
  return latency(u);
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const active = db.listings.filter((l) => l.status === "active");
  const sellers = new Set(active.map((l) => l.sellerId)).size;
  const ratings = db.reviews.map((r) => r.rating);
  return latency({
    activeListings: active.length,
    sellers,
    averageRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    reviewCount: ratings.length,
  });
}
