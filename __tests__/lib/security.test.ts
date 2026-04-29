// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ storage: { from: vi.fn() } })),
}));

import { validateUpload, validateAvatarUpload, validateCoverUpload } from "@/lib/storage";

// ── File extension sanitization ──────────────────────────────────────────────

function sanitizeExt(filename: string, fallback = "bin"): string {
  const raw = filename.split(".").pop() ?? fallback;
  return raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || fallback;
}

describe("sanitizeExt", () => {
  it("passes normal extensions", () => {
    expect(sanitizeExt("file.pdf")).toBe("pdf");
    expect(sanitizeExt("archive.zip")).toBe("zip");
    expect(sanitizeExt("image.png")).toBe("png");
  });

  it("strips path traversal attempts", () => {
    // "../../etc/passwd".split(".").pop() = "/etc/passwd" → stripped to "etcpasswd"
    expect(sanitizeExt("../../etc/passwd")).toBe("etcpasswd");
    expect(sanitizeExt("file.php%00.jpg")).toBe("jpg");
  });

  it("strips special characters", () => {
    expect(sanitizeExt("file.<script>.js")).toBe("js");
    expect(sanitizeExt("file.ph/p")).toBe("php");
  });

  it("falls back when extension is empty after sanitization", () => {
    expect(sanitizeExt("file.")).toBe("bin");
    // no dot → entire name treated as ext, truncated to 10 chars
    expect(sanitizeExt("noextension")).toBe("noextensio"); // slice(0,10) of 11-char string
  });

  it("truncates long extensions", () => {
    expect(sanitizeExt("file." + "a".repeat(20))).toHaveLength(10);
  });
});

// ── Open redirect prevention ─────────────────────────────────────────────────

function safeRedirectPath(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

describe("safeRedirectPath", () => {
  it("allows valid relative paths", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/dashboard/products")).toBe("/dashboard/products");
  });

  it("blocks absolute URLs", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("http://phishing.io")).toBe("/dashboard");
  });

  it("blocks protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
  });

  it("falls back for empty string", () => {
    expect(safeRedirectPath("")).toBe("/dashboard");
  });
});

// ── Upload validation ────────────────────────────────────────────────────────

describe("validateUpload", () => {
  it("accepts allowed MIME types", () => {
    expect(validateUpload("application/pdf", 1000).ok).toBe(true);
    expect(validateUpload("application/zip", 1000).ok).toBe(true);
    expect(validateUpload("image/png", 1000).ok).toBe(true);
  });

  it("rejects disallowed MIME types", () => {
    expect(validateUpload("application/x-php", 1000).ok).toBe(false);
    expect(validateUpload("text/html", 1000).ok).toBe(false);
    expect(validateUpload("application/x-executable", 1000).ok).toBe(false);
  });

  it("rejects files over 50MB", () => {
    const over50MB = 51 * 1024 * 1024;
    expect(validateUpload("application/pdf", over50MB).ok).toBe(false);
    expect(validateUpload("application/pdf", over50MB).error).toContain("50MB");
  });

  it("accepts files at exactly 50MB", () => {
    expect(validateUpload("application/pdf", 50 * 1024 * 1024).ok).toBe(true);
  });
});

describe("validateCoverUpload", () => {
  it("accepts PNG, JPG, WebP", () => {
    expect(validateCoverUpload("image/png", 1000).ok).toBe(true);
    expect(validateCoverUpload("image/jpeg", 1000).ok).toBe(true);
    expect(validateCoverUpload("image/webp", 1000).ok).toBe(true);
  });

  it("rejects GIF and other formats", () => {
    expect(validateCoverUpload("image/gif", 1000).ok).toBe(false);
    expect(validateCoverUpload("application/pdf", 1000).ok).toBe(false);
  });

  it("rejects files over 5MB", () => {
    const over5MB = 6 * 1024 * 1024;
    expect(validateCoverUpload("image/png", over5MB).ok).toBe(false);
    expect(validateCoverUpload("image/png", over5MB).error).toContain("5MB");
  });
});

describe("validateAvatarUpload", () => {
  it("rejects files over 2MB", () => {
    const over2MB = 3 * 1024 * 1024;
    expect(validateAvatarUpload("image/png", over2MB).ok).toBe(false);
  });

  it("rejects non-image types", () => {
    expect(validateAvatarUpload("application/pdf", 1000).ok).toBe(false);
  });
});
