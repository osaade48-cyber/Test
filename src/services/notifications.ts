import type { Notification } from "@/types/models";
import { db, latency, persist } from "./mock/db";
import { currentUserId, requireUserId } from "./auth";
import { emit } from "./events";

export function unreadNotificationsSync(): number {
  const me = currentUserId();
  return me ? db.notifications.filter((n) => n.userId === me && !n.read).length : 0;
}

export async function getNotifications(): Promise<Notification[]> {
  const me = requireUserId();
  return latency(db.notifications.filter((n) => n.userId === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function markAllRead(): Promise<void> {
  const me = requireUserId();
  db.notifications.forEach((n) => n.userId === me && (n.read = true));
  persist();
  emit("notifications");
  await latency(null);
}

export async function markRead(id: string): Promise<void> {
  const n = db.notifications.find((x) => x.id === id);
  if (n) n.read = true;
  persist();
  emit("notifications");
}
