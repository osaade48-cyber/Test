import { describe, expect, it } from "vitest";
import { canTransition, fundsReleased, happyPath } from "../orderState";

describe("order state machine", () => {
  it("follows the post flow", () => {
    expect(canTransition("post", "paid_in_escrow", "shipped", "seller")).toBe(true);
    expect(canTransition("post", "shipped", "delivered", "system")).toBe(true);
    expect(canTransition("post", "delivered", "completed", "system")).toBe(true);
  });
  it("follows the handover flow", () => {
    expect(canTransition("pickup", "paid_in_escrow", "ready_for_handover", "system")).toBe(true);
    expect(canTransition("meetup", "ready_for_handover", "completed", "buyer")).toBe(true);
    expect(canTransition("pickup", "paid_in_escrow", "shipped", "seller")).toBe(false);
  });
  it("only the buyer can complete a handover", () => {
    expect(canTransition("pickup", "ready_for_handover", "completed", "seller")).toBe(false);
  });
  it("only admins rule disputes", () => {
    expect(canTransition("post", "disputed", "refunded", "admin")).toBe(true);
    expect(canTransition("post", "disputed", "completed", "seller")).toBe(false);
  });
  it("releases funds only on completed", () => {
    expect(happyPath("post").filter(fundsReleased)).toEqual(["completed"]);
  });
});
