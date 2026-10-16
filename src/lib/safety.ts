import { CAR_SEAT_LIFESPAN_YEARS } from "@/config/business";

/** Car seat expiry from its manufacture date. */
export function carSeatExpiry(manufactureDate: string): string {
  const d = new Date(manufactureDate);
  d.setFullYear(d.getFullYear() + CAR_SEAT_LIFESPAN_YEARS);
  return d.toISOString();
}

export function isExpired(expiry: string | undefined, now = new Date()): boolean {
  return !!expiry && new Date(expiry).getTime() < now.getTime();
}
