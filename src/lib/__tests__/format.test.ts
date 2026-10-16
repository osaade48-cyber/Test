import { describe, expect, it } from "vitest";
import { formatDate, formatMoney } from "../format";

describe("format", () => {
  it("formats ISO dates for humans", () => expect(formatDate("2026-05-17T07:26:19.968Z")).toBe("17 May 2026"));
  it("formats AUD", () => expect(formatMoney(1220)).toBe("$1,220.00"));
});
