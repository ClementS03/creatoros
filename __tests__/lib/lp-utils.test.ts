import { describe, it, expect } from "vitest";
import { parseVideoUrl, generateId, reorderBlocks, defaultBlocks } from "../../lib/lp-utils";
import type { Block } from "../../types/blocks";

describe("parseVideoUrl", () => {
  it("parses youtube.com/watch?v=ID", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("parses youtu.be/ID", () => {
    expect(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("parses vimeo.com/ID", () => {
    expect(parseVideoUrl("https://vimeo.com/123456789"))
      .toBe("https://player.vimeo.com/video/123456789");
  });

  it("returns null for unsupported URL", () => {
    expect(parseVideoUrl("https://example.com/video")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(parseVideoUrl("not-a-url")).toBeNull();
  });

  it("returns null for youtube URL without v param", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch")).toBeNull();
  });
});

describe("reorderBlocks", () => {
  const makeBlock = (id: string, order: number): Block => ({
    id, type: "text", order, data: { body: id },
  });

  it("moves block from index 1 to index 2", () => {
    const blocks = [makeBlock("a", 0), makeBlock("b", 1), makeBlock("c", 2)];
    const result = reorderBlocks(blocks, 1, 2);
    expect(result.map(b => b.id)).toEqual(["a", "c", "b"]);
    expect(result.map(b => b.order)).toEqual([0, 1, 2]);
  });

  it("moves block from index 2 to index 0", () => {
    const blocks = [makeBlock("a", 0), makeBlock("b", 1), makeBlock("c", 2)];
    const result = reorderBlocks(blocks, 2, 0);
    expect(result.map(b => b.id)).toEqual(["c", "a", "b"]);
  });

  it("preserves order numbers after reorder", () => {
    const blocks = [makeBlock("a", 0), makeBlock("b", 1), makeBlock("c", 2)];
    const result = reorderBlocks(blocks, 0, 2);
    expect(result.every((b, i) => b.order === i)).toBe(true);
  });
});

describe("defaultBlocks", () => {
  it("returns hero and cta blocks", () => {
    const blocks = defaultBlocks("My Product", 4900);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("hero");
    expect(blocks[1].type).toBe("cta");
  });

  it("sets hero headline to product name", () => {
    const blocks = defaultBlocks("Cool Kit", 4900);
    expect((blocks[0].data as { headline: string }).headline).toBe("Cool Kit");
  });

  it("uses Free for price 0", () => {
    const blocks = defaultBlocks("Free Guide", 0);
    expect((blocks[0].data as { button_label: string }).button_label).toBe("Get for free");
  });

  it("formats price in button label", () => {
    const blocks = defaultBlocks("Kit", 4900);
    expect((blocks[0].data as { button_label: string }).button_label).toContain("$49.00");
  });
});
