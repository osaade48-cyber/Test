/** "My little one" profiles. Optional; parents can add several children. */
import type { Child } from "@/types/models";
import { uid } from "@/lib/id";
import { db, latency, persist } from "./mock/db";
import { requireUserId } from "./auth";
import { emit } from "./events";

export async function getChildren(): Promise<Child[]> {
  const me = requireUserId();
  return latency(db.children.filter((c) => c.parentId === me));
}

export async function addChild(input: Omit<Child, "id" | "parentId">): Promise<Child> {
  const me = requireUserId();
  const child: Child = { id: uid("ch"), parentId: me, ...input };
  db.children.push(child);
  persist();
  emit("children");
  return latency(child);
}

export async function removeChild(id: string): Promise<void> {
  db.children = db.children.filter((c) => c.id !== id);
  persist();
  emit("children");
  await latency(null);
}
