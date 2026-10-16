/**
 * Product recall lookups.
 * TODO(recalls): connect to the ACCC Product Safety Australia recalls data
 * (productsafety.gov.au). Today this reads the mock status on the listing.
 */
import type { RecallStatus } from "@/types/models";
import { db, latency } from "./mock/db";

export async function checkRecall(listingId: string): Promise<{ status: RecallStatus; checkedAt: string; source: string }> {
  const l = db.listings.find((x) => x.id === listingId);
  return latency({ status: l?.recallStatus ?? "not_checked", checkedAt: new Date().toISOString(), source: "ACCC Product Safety (mock)" });
}
