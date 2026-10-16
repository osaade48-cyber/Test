import { AGE_GROUPS } from "@/config/taxonomy";
import type { AgeGroup, Child } from "@/types/models";
import { monthsBetween } from "./format";

/** Age in months (negative while expecting). */
export function childMonths(c: Child, now = new Date()): number {
  if (c.birthDate) return monthsBetween(new Date(c.birthDate), now);
  if (c.dueDate) return -Math.max(0, monthsBetween(now, new Date(c.dueDate)));
  return 0;
}

const BANDS = AGE_GROUPS.filter((g) => g.id !== "all");

export function currentAgeGroup(c: Child, now = new Date()): AgeGroup {
  const m = Math.max(0, childMonths(c, now));
  return (BANDS.find((g) => m >= g.months[0] && m < g.months[1]) ?? BANDS[BANDS.length - 1]).id;
}

/** The band a child is moving into next (expecting → newborn). */
export function nextAgeGroup(c: Child, now = new Date()): AgeGroup {
  if (!c.birthDate) return "newborn";
  const cur = currentAgeGroup(c, now);
  const i = BANDS.findIndex((g) => g.id === cur);
  return BANDS[Math.min(i + 1, BANDS.length - 1)].id;
}

/** Bands the child has already outgrown — things to sell. */
export function outgrownAgeGroups(c: Child, now = new Date()): AgeGroup[] {
  if (!c.birthDate) return [];
  const cur = currentAgeGroup(c, now);
  const i = BANDS.findIndex((g) => g.id === cur);
  return BANDS.slice(0, i).map((g) => g.id);
}
