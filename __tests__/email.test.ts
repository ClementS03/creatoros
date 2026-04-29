import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn() },
    batch: { send: vi.fn() },
  })),
}));

const { interpolate, wrapEmailBody } = await import("../lib/email");

describe("interpolate", () => {
  it("replaces a single variable", () => {
    expect(interpolate("Hello {{name}}", { name: "Jane" })).toBe("Hello Jane");
  });

  it("replaces multiple occurrences of the same variable", () => {
    expect(interpolate("{{name}} and {{name}}", { name: "Jane" })).toBe("Jane and Jane");
  });

  it("replaces multiple different variables", () => {
    expect(
      interpolate("Hi {{name}}, here is {{link}}", { name: "Jane", link: "http://example.com" })
    ).toBe("Hi Jane, here is http://example.com");
  });

  it("leaves unknown variables untouched", () => {
    expect(interpolate("Hello {{unknown}}", { name: "Jane" })).toBe("Hello {{unknown}}");
  });

  it("returns template unchanged when vars is empty", () => {
    expect(interpolate("Hello {{name}}", {})).toBe("Hello {{name}}");
  });

  it("handles empty string template", () => {
    expect(interpolate("", { name: "Jane" })).toBe("");
  });
});

describe("wrapEmailBody", () => {
  it("wraps content in an HTML email layout", () => {
    const html = wrapEmailBody("Hello there", "My Brand");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("My Brand");
    expect(html).toContain("Hello there");
    expect(html).toContain("Powered by CreatorOS");
  });

  it("splits body on newlines into separate paragraphs", () => {
    const html = wrapEmailBody("Line one\nLine two", "Brand");
    expect(html).toContain("Line one");
    expect(html).toContain("Line two");
  });

  it("includes the fromName in the header", () => {
    const html = wrapEmailBody("body", "Awesome Creator");
    expect(html).toContain("Awesome Creator");
  });
});
