/**
 * Authentication. Today: a mock Google sign-in that logs in the demo user.
 * TODO(auth): replace with Google OAuth (VITE_GOOGLE_CLIENT_ID) → backend
 * session/JWT. Every component gets the current user through this module.
 */
import type { User } from "@/types/models";
import { db, latency, ServiceError } from "./mock/db";
import { CURRENT_USER_ID } from "./mock/seed";
import { emit } from "./events";

const SESSION_KEY = "kindo:session";

function readSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/** Synchronous id of the signed-in user, or null. */
export function currentUserId(): string | null {
  return readSession();
}

export function requireUserId(): string {
  const id = readSession();
  if (!id) throw new ServiceError("Please sign in to continue.", "unauthenticated");
  return id;
}

export async function getSession(): Promise<User | null> {
  const id = readSession();
  const user = id ? db.users.find((u) => u.id === id) ?? null : null;
  return latency(user);
}

/** TODO(auth): open the Google OAuth popup / redirect and exchange the code with the backend. */
export async function signInWithGoogle(): Promise<User> {
  const user = db.users.find((u) => u.id === CURRENT_USER_ID)!;
  const result = await latency(user);
  try {
    localStorage.setItem(SESSION_KEY, user.id);
  } catch {
    /* ignore */
  }
  emit("auth");
  return result;
}

/** TODO(auth): revoke the session on the backend. */
export async function signOut(): Promise<void> {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  emit("auth");
}
