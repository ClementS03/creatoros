import { describe, it, expect } from "vitest";
import { calculateBumpTotal } from "../../lib/order-bump-utils";
import type { OrderBumps } from "../../types/index";

describe("calculateBumpTotal", () => {
  const bumps: OrderBumps = {
    items: [
      { product_id: "a", custom_price: 900, label: "Bonus A" },
      { product_id: "b", custom_price: 500, label: "Bonus B" },
    ],
    bundle_price: 1200,
  };

  it("returns 0 for empty selection", () => {
    expect(calculateBumpTotal(bumps, [])).toBe(0);
  });

  it("sums custom_price for single selection", () => {
    expect(calculateBumpTotal(bumps, ["a"])).toBe(900);
  });

  it("uses bundle_price when all selected and bundle_price set", () => {
    expect(calculateBumpTotal(bumps, ["a", "b"])).toBe(1200);
  });

  it("sums all when all selected but bundle_price is null", () => {
    const noBundlePrice: OrderBumps = { ...bumps, bundle_price: null };
    expect(calculateBumpTotal(noBundlePrice, ["a", "b"])).toBe(1400);
  });

  it("returns 0 for unknown product_id in selection", () => {
    expect(calculateBumpTotal(bumps, ["unknown"])).toBe(0);
  });
});
