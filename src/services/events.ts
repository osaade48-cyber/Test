/**
 * Tiny pub/sub so screens can refresh when data changes elsewhere
 * (e.g. cart badge after "Add to bundle"). A real backend would use
 * websockets or query invalidation instead.
 */
export type Topic = "cart" | "saved" | "messages" | "notifications" | "orders" | "listings" | "auth" | "children" | "alerts" | "admin" | "subscription";

const subs = new Map<Topic, Set<() => void>>();

export function subscribe(topic: Topic, fn: () => void): () => void {
  if (!subs.has(topic)) subs.set(topic, new Set());
  subs.get(topic)!.add(fn);
  return () => subs.get(topic)!.delete(fn);
}

export function emit(...topics: Topic[]) {
  for (const t of topics) subs.get(t)?.forEach((fn) => fn());
}
