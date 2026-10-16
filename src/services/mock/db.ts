/**
 * In-browser mock database. Persists to localStorage so the demo survives a
 * refresh. Only the service modules may import this file.
 */
import { MOCK_LATENCY_MS } from "@/config/business";
import { createSeed, DB_VERSION, type MockDB } from "./seed";

const KEY = "kindo:mockdb";

function load(): MockDB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDB;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    /* storage unavailable — fall back to the seed */
  }
  return createSeed();
}

export const db: MockDB = load();

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignore quota / private mode */
  }
}

export function resetDb() {
  const fresh = createSeed();
  Object.assign(db, fresh);
  persist();
}

/** Simulated network latency, plus an opt-in failure switch for testing error states. */
export async function latency<T>(value: T): Promise<T> {
  const { min, max } = MOCK_LATENCY_MS;
  await new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
  let fail = false;
  try {
    fail = localStorage.getItem("kindo:mockFail") === "1";
  } catch {
    /* ignore */
  }
  if (fail) throw new Error("We couldn't reach Kindo. Check your connection and try again.");
  return structuredClone(value);
}

export class ServiceError extends Error {
  constructor(message: string, public code: string = "error") {
    super(message);
  }
}

export const nowIso = () => new Date().toISOString();
