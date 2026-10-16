/** Demo-only controls. Remove when the real backend is connected. */
import { resetDb } from "./mock/db";
import { emit } from "./events";

export function resetDemoData() {
  resetDb();
  emit("cart", "saved", "messages", "notifications", "orders", "listings", "children", "alerts", "admin", "subscription", "auth");
}

export function mockFailuresEnabled(): boolean {
  try {
    return localStorage.getItem("kindo:mockFail") === "1";
  } catch {
    return false;
  }
}

/** Makes every service call fail, so error states can be checked. */
export function setMockFailures(on: boolean) {
  try {
    if (on) localStorage.setItem("kindo:mockFail", "1");
    else localStorage.removeItem("kindo:mockFail");
  } catch {
    /* ignore */
  }
}
