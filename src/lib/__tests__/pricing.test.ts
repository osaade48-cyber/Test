import { describe, expect, it } from "vitest";
import { availableMethods, buyerFee, cardShippingTag, defaultMethod, priceOrder, totalLabel } from "../pricing";
import type { Listing } from "@/types/models";

const base = (over: Partial<Listing>): Listing & { effectivePrice: number } => {
  const l = {
    id: "x", sellerId: "s", title: "t", brand: "b", description: "", category: "clothing", condition: "good", ageGroup: "all",
    price: 20, photos: [], isLargeItem: false, delivery: { post: { satchel: "S" }, pickup: true, meetup: false },
    location: { suburb: "Dural", state: "NSW", postcode: "2158", lat: 0, lng: 0 }, recallStatus: "not_checked", status: "active",
    views: 0, saves: 0, createdAt: "", updatedAt: "", ...over,
  } as Listing;
  return { ...l, effectivePrice: l.price };
};

describe("buyerFee", () => {
  it("is 5% + $1.50", () => expect(buyerFee(20)).toBe(2.5));
  it("caps at $30", () => expect(buyerFee(1220)).toBe(30));
  it("is uncapped just under the cap", () => expect(buyerFee(500)).toBe(26.5));
  it("is zero for an empty order", () => expect(buyerFee(0)).toBe(0));
});

describe("priceOrder", () => {
  it("charges satchel postage under the threshold and reports the gap", () => {
    const p = priceOrder([base({ price: 57 })], "post");
    expect(p.postage).toBe(11.5);
    expect(p.freeShippingGap).toBe(18);
    expect(p.total).toBe(57 + 11.5 + buyerFee(57));
    expect(p.postageLabel).toBe("AusPost Satchel S · $11.50");
  });

  it("is free postage at $75 or more from one seller, one satchel for the bundle", () => {
    const p = priceOrder([base({ price: 40 }), base({ price: 35, delivery: { post: { satchel: "M" }, pickup: false, meetup: false } })], "post");
    expect(p.postage).toBe(0);
    expect(p.freeShipping).toBe(true);
    expect(p.total).toBe(75 + buyerFee(75));
  });

  it("pickup has no postage", () => {
    const p = priceOrder([base({ price: 650, category: "prams", isLargeItem: true, delivery: { pickup: true, meetup: true } })], "pickup", { sellerSuburb: "Dural" });
    expect(p.postage).toBe(0);
    expect(p.total).toBe(680);
    expect(p.postageLabel).toBe("Pickup in Dural · no postage");
  });

  it("large items are never free and need a quote", () => {
    const pram = base({ price: 650, category: "prams", delivery: { largeCalculated: true, pickup: true, meetup: false } });
    const unknown = priceOrder([pram], "large_calculated");
    expect(unknown.postage).toBeNull();
    expect(totalLabel(unknown)).toContain("+ shipping");
    const quoted = priceOrder([pram], "large_calculated", { distanceKm: 100 });
    expect(quoted.postage).toBeGreaterThan(0);
    expect(quoted.freeShipping).toBe(false);
  });
});

describe("availableMethods", () => {
  it("never offers satchel post for large items", () => {
    const cot = base({ category: "nursery", delivery: { post: { satchel: "XL" }, pickup: true, meetup: false } });
    expect(availableMethods([cot])).not.toContain("post");
  });
});

describe("large item defaults", () => {
  it("offers pickup before calculated shipping", () => {
    const pram = base({ category: "prams", delivery: { largeCalculated: true, pickup: true, meetup: false } });
    expect(availableMethods([pram])[0]).toBe("pickup");
  });
});

describe("far-away pickups", () => {
  const pram = () => base({ category: "prams", delivery: { largeCalculated: true, pickup: true, meetup: false } });
  it("defaults to pickup when close", () => expect(defaultMethod(availableMethods([pram()]), 10)).toBe("pickup"));
  it("defaults to courier when pickup is too far", () => expect(defaultMethod(availableMethods([pram()]), 700)).toBe("large_calculated"));
  it("keeps pickup when it's the only option", () => {
    const bike = base({ delivery: { pickup: true, meetup: true } });
    expect(defaultMethod(availableMethods([bike]), 700)).toBe("pickup");
    expect(cardShippingTag(bike, 700)).toEqual({ kind: "far", label: "Pickup only · 700 km" });
    expect(cardShippingTag(bike, 12).kind).toBe("pickup");
  });
  it("shows postage instead of a far pickup", () => expect(cardShippingTag(base({ price: 20 }), 700).label).toBe("+ postage"));
});
