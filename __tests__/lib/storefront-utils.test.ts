// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  getActiveSocialLinks,
  calcDiscount,
  formatPrice,
} from "@/lib/storefront-utils";

describe("getActiveSocialLinks", () => {
  it("returns only platforms with non-empty URLs", () => {
    const result = getActiveSocialLinks({
      twitter: "https://x.com/test",
      instagram: "",
      youtube: "https://youtube.com/@test",
    });
    expect(result).toHaveLength(2);
    expect(result.map((l) => l.platform)).toEqual(["twitter", "youtube"]);
  });

  it("returns empty array when all links are empty", () => {
    expect(getActiveSocialLinks({ twitter: "", instagram: "" })).toHaveLength(0);
  });

  it("returns empty array for empty object", () => {
    expect(getActiveSocialLinks({})).toHaveLength(0);
  });

  it("preserves URLs as-is", () => {
    const result = getActiveSocialLinks({ website: "https://mysite.com" });
    expect(result[0].url).toBe("https://mysite.com");
  });
});

describe("calcDiscount", () => {
  it("returns null when compareAtPrice is null", () => {
    expect(calcDiscount(1000, null)).toBeNull();
  });

  it("returns null when compareAtPrice is undefined", () => {
    expect(calcDiscount(1000, undefined)).toBeNull();
  });

  it("returns null when compareAtPrice equals price", () => {
    expect(calcDiscount(1000, 1000)).toBeNull();
  });

  it("returns null when compareAtPrice is less than price", () => {
    expect(calcDiscount(2000, 1000)).toBeNull();
  });

  it("calculates 50% discount", () => {
    expect(calcDiscount(1000, 2000)).toBe(50);
  });

  it("calculates discount and rounds", () => {
    // (1999 - 990) / 1999 * 100 = 50.475 → rounds to 50
    expect(calcDiscount(990, 1999)).toBe(50);
  });

  it("calculates discount for small amounts", () => {
    expect(calcDiscount(100, 200)).toBe(50);
  });

  it("returns 0 only when price is 0 and compareAtPrice is positive", () => {
    expect(calcDiscount(0, 1000)).toBe(100);
  });
});

describe("formatPrice", () => {
  it("returns 'Free' for price 0", () => {
    expect(formatPrice(0, "usd")).toBe("Free");
  });

  it("formats USD cents correctly", () => {
    expect(formatPrice(1999, "usd")).toBe("$19.99");
  });

  it("formats whole dollar amounts", () => {
    expect(formatPrice(5000, "usd")).toBe("$50.00");
  });
});
