import { MIN_LISTING_PHOTOS, MAX_TITLE_LENGTH } from "@/config/business";
import { SAFETY_CHECKLISTS } from "@/config/taxonomy";
import type { ListingDraft } from "@/types/models";
import { isLargeItem } from "./pricing";
import { isExpired } from "./safety";

export interface ValidationIssue {
  field: string;
  step: 1 | 2 | 3;
  message: string;
}

/** Rules a listing must pass before it can be published. Server must re-check. */
export function validateForPublish(d: ListingDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if ((d.photos?.length ?? 0) < MIN_LISTING_PHOTOS) {
    issues.push({ field: "photos", step: 1, message: `Add at least ${MIN_LISTING_PHOTOS} photos` });
  }
  if (!d.title?.trim()) issues.push({ field: "title", step: 2, message: "Add a title" });
  else if (d.title.length > MAX_TITLE_LENGTH) issues.push({ field: "title", step: 2, message: `Keep the title under ${MAX_TITLE_LENGTH} characters` });
  if (!d.category) issues.push({ field: "category", step: 2, message: "Choose a category" });
  if (!d.condition) issues.push({ field: "condition", step: 2, message: "Choose the condition" });
  if (!d.ageGroup) issues.push({ field: "ageGroup", step: 2, message: "Choose an age group" });
  if (d.category === "clothing" && !d.size) issues.push({ field: "size", step: 2, message: "Choose a clothing size" });

  if (d.category && SAFETY_CHECKLISTS[d.category]) {
    if (!d.safety?.completed) issues.push({ field: "safety", step: 2, message: "Complete the safety checklist" });
    if (d.category === "car-seats" && !d.safety?.manufactureDate) {
      issues.push({ field: "manufactureDate", step: 2, message: "Add the car seat's manufacture date" });
    }
  }

  if (!d.price || d.price <= 0) issues.push({ field: "price", step: 3, message: "Set a price" });
  const del = d.delivery;
  if (!del || (!del.post && !del.largeCalculated && !del.pickup && !del.meetup)) {
    issues.push({ field: "delivery", step: 3, message: "Choose at least one way to get it to the buyer" });
  }
  if (d.category && del?.post && isLargeItem({ category: d.category, isLargeItem: !!d.isLargeItem })) {
    issues.push({ field: "delivery", step: 3, message: "Large items can't be posted in a satchel — choose pickup, meetup or calculated shipping" });
  }
  return issues;
}

/** Non-blocking warnings shown alongside the form. */
export function listingWarnings(d: ListingDraft): string[] {
  const w: string[] = [];
  if (d.category === "car-seats" && isExpired(d.safety?.expiryDate)) {
    w.push("This car seat has passed its expiry date. Expired car seats aren't safe to use and shouldn't be sold.");
  }
  if (d.safety?.answers?.some((a) => !a.answer)) {
    w.push("You answered “no” to a safety question. Describe the issue clearly — buyers will see your answers.");
  }
  return w;
}
