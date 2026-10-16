import { TRUST_TIERS } from "@/config/business";
import type { TrustTier, User } from "@/types/models";

export const TIER_ORDER: TrustTier[] = ["new", "trusted", "verified", "pro"];

/** Derive the tier a user qualifies for. The backend should own this. */
export function computeTier(u: Pick<User, "completedSales" | "rating" | "idVerified" | "isPro">): TrustTier {
  const rating = u.rating ?? 0;
  const v = TRUST_TIERS.verified;
  const t = TRUST_TIERS.trusted;
  const verified = u.completedSales >= v.minCompletedSales && rating >= v.minRating && !!u.idVerified;
  if (verified && u.isPro) return "pro";
  if (verified) return "verified";
  if (u.completedSales >= t.minCompletedSales && rating >= t.minRating) return "trusted";
  return "new";
}

export interface TierStep {
  label: string;
  done: boolean;
}

/** What the user still needs to reach the next tier. */
export function nextTierSteps(u: User): { next: TrustTier | null; steps: TierStep[] } {
  const tier = computeTier(u);
  const rating = u.rating ?? 0;
  if (tier === "new") {
    const t = TRUST_TIERS.trusted;
    return {
      next: "trusted",
      steps: [
        { label: `Complete ${t.minCompletedSales} sales (${Math.min(u.completedSales, t.minCompletedSales)}/${t.minCompletedSales})`, done: u.completedSales >= t.minCompletedSales },
        { label: `Keep a ${t.minRating}★ rating or higher`, done: rating >= t.minRating },
      ],
    };
  }
  if (tier === "trusted") {
    const v = TRUST_TIERS.verified;
    return {
      next: "verified",
      steps: [
        { label: `Complete ${v.minCompletedSales} sales (${Math.min(u.completedSales, v.minCompletedSales)}/${v.minCompletedSales})`, done: u.completedSales >= v.minCompletedSales },
        { label: `Keep a ${v.minRating}★ rating or higher`, done: rating >= v.minRating },
        { label: "Verify your ID", done: !!u.idVerified },
      ],
    };
  }
  if (tier === "verified") return { next: "pro", steps: [{ label: "Subscribe to Kindo Pro", done: !!u.isPro }] };
  return { next: null, steps: [] };
}

export const tierLabel = (t: TrustTier) => TRUST_TIERS[t].label;
