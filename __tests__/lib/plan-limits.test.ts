// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { canAddProduct, isProCreator, FREE_PRODUCT_LIMIT } from "@/lib/plan-limits";

function makeSupabase(plan: string, count: number = 0) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { plan }, error: null }),
          eq: vi.fn().mockResolvedValue({ count, error: null }),
        }),
      }),
    }),
  } as any;
}

describe("FREE_PRODUCT_LIMIT", () => {
  it("is 3", () => {
    expect(FREE_PRODUCT_LIMIT).toBe(3);
  });
});

describe("isProCreator", () => {
  it("returns true for pro plan", async () => {
    const supabase = makeSupabase("pro");
    expect(await isProCreator(supabase, "user-1")).toBe(true);
  });

  it("returns false for free plan", async () => {
    const supabase = makeSupabase("free");
    expect(await isProCreator(supabase, "user-1")).toBe(false);
  });

  it("returns false if user not found", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
          }),
        }),
      }),
    } as any;
    expect(await isProCreator(supabase, "user-1")).toBe(false);
  });
});

describe("canAddProduct", () => {
  it("allows pro user regardless of count", async () => {
    expect(await canAddProduct({} as any, "u1", "pro", 99)).toBe(true);
  });

  it("allows free user below limit", async () => {
    expect(await canAddProduct({} as any, "u1", "free", 2)).toBe(true);
  });

  it("blocks free user at limit", async () => {
    expect(await canAddProduct({} as any, "u1", "free", 3)).toBe(false);
  });

  it("blocks free user above limit", async () => {
    expect(await canAddProduct({} as any, "u1", "free", 10)).toBe(false);
  });
});
