import { describe, it, expect } from "vitest";

function validateSubscribeInput(body: { productId?: string; name?: string; email?: string }) {
  if (!body.email || !body.email.includes("@")) return { error: "Invalid email" };
  if (!body.name?.trim()) return { error: "Name is required" };
  if (!body.productId) return { error: "Missing productId" };
  return null;
}

describe("subscribe input validation", () => {
  it("rejects missing email", () => {
    expect(validateSubscribeInput({ name: "Jane", productId: "123" })).toEqual({ error: "Invalid email" });
  });

  it("rejects email without @", () => {
    expect(validateSubscribeInput({ email: "notanemail", name: "Jane", productId: "123" })).toEqual({ error: "Invalid email" });
  });

  it("rejects missing name", () => {
    expect(validateSubscribeInput({ email: "jane@example.com", productId: "123" })).toEqual({ error: "Name is required" });
  });

  it("rejects whitespace-only name", () => {
    expect(validateSubscribeInput({ email: "jane@example.com", name: "   ", productId: "123" })).toEqual({ error: "Name is required" });
  });

  it("rejects missing productId", () => {
    expect(validateSubscribeInput({ email: "jane@example.com", name: "Jane" })).toEqual({ error: "Missing productId" });
  });

  it("returns null for valid input", () => {
    expect(validateSubscribeInput({ email: "jane@example.com", name: "Jane", productId: "abc-123" })).toBeNull();
  });
});
