/**
 * Shared formatting helpers. Use these everywhere — never print an ISO string
 * or raw number to the screen.
 */

const LOCALE = "en-AU";

const moneyFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "AUD" });
const moneyWholeFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

/** $1,220.00 — or $1,220 with `{ whole: true }` when the amount has no cents. */
export function formatMoney(amount: number, opts: { whole?: boolean } = {}): string {
  if (opts.whole && Number.isInteger(amount)) return moneyWholeFmt.format(amount);
  return moneyFmt.format(amount);
}

const toDate = (d: string | Date) => (typeof d === "string" ? new Date(d) : d);

/** 17 May 2026 */
export function formatDate(d: string | Date): string {
  return toDate(d).toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
}

/** 17 May 2026, 5:26 pm */
export function formatDateTime(d: string | Date): string {
  const date = toDate(d);
  return `${formatDate(date)}, ${date.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" })}`;
}

/** Sat 17 May */
export function formatShortDay(d: string | Date): string {
  return toDate(d).toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short" });
}

/** "just now", "5 min ago", "3 h ago", "2 days ago", then a date. */
export function formatRelative(d: string | Date, now: Date = new Date()): string {
  const diffSec = Math.round((now.getTime() - toDate(d).getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(d);
}

/** "in 23 h", "in 40 min", or "expired". */
export function formatTimeLeft(until: string | Date, now: Date = new Date()): string {
  const ms = toDate(until).getTime() - now.getTime();
  if (ms <= 0) return "expired";
  const min = Math.ceil(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} days`;
}

/** "7 months", "1 year 2 months", "due in 6 weeks" */
export function formatChildAge(birth?: string, due?: string, now: Date = new Date()): string {
  if (due && !birth) {
    const weeks = Math.round((new Date(due).getTime() - now.getTime()) / (7 * 864e5));
    if (weeks <= 0) return "due any day";
    return `due in ${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  if (!birth) return "";
  const m = monthsBetween(new Date(birth), now);
  if (m < 1) return "newborn";
  if (m < 24) return `${m} month${m === 1 ? "" : "s"}`;
  const y = Math.floor(m / 12);
  const rem = m % 12;
  return rem ? `${y} years ${rem} month${rem === 1 ? "" : "s"}` : `${y} years`;
}

export function monthsBetween(from: Date, to: Date): number {
  let m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) m -= 1;
  return Math.max(0, m);
}

export function formatDistance(km: number): string {
  if (km < 1) return "under 1 km away";
  return `${Math.round(km)} km away`;
}

export function pluralise(n: number, word: string, plural = `${word}s`): string {
  return `${n} ${n === 1 ? word : plural}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
