import { describe, it, expect } from "vitest";
import { isLessonAvailable, parseVideoEmbedUrl } from "../../lib/course-utils";

describe("isLessonAvailable", () => {
  const now = new Date("2026-05-01T12:00:00Z");

  function orderDate(daysAgo: number) {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  }

  it("returns true when drip_days = 0", () => {
    expect(isLessonAvailable({ drip_days: 0 }, orderDate(0), new Set(), now)).toBe(true);
  });

  it("returns true when drip days have passed", () => {
    expect(isLessonAvailable({ drip_days: 7 }, orderDate(8), new Set(), now)).toBe(true);
  });

  it("returns false when drip days have not passed", () => {
    expect(isLessonAvailable({ drip_days: 7 }, orderDate(3), new Set(), now)).toBe(false);
  });

  it("returns true when lesson is manually unlocked regardless of drip", () => {
    expect(isLessonAvailable({ drip_days: 7, id: "lesson-1" }, orderDate(1), new Set(["lesson-1"]), now)).toBe(true);
  });

  it("returns false at drip boundary (1 hour short)", () => {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    d.setHours(d.getHours() + 1);
    expect(isLessonAvailable({ drip_days: 7 }, d.toISOString(), new Set(), now)).toBe(false);
  });
});

describe("parseVideoEmbedUrl", () => {
  it("converts youtube.com/watch to embed URL with enablejsapi", () => {
    expect(parseVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1");
  });

  it("converts youtu.be to embed URL", () => {
    expect(parseVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1");
  });

  it("converts vimeo to embed URL", () => {
    expect(parseVideoEmbedUrl("https://vimeo.com/123456789"))
      .toBe("https://player.vimeo.com/video/123456789");
  });

  it("returns null for unsupported URL", () => {
    expect(parseVideoEmbedUrl("https://example.com/video")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(parseVideoEmbedUrl("not-a-url")).toBeNull();
  });
});
