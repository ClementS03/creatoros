import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/octet-stream",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const MAX_PRODUCT_SIZE = 50 * 1024 * 1024; // 50MB (Supabase free tier limit)
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB
const AVATAR_MIMES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const COVER_MIMES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function validateUpload(
  mime: string,
  size: number
): { ok: boolean; error?: string } {
  if (!ALLOWED_MIMES.has(mime)) return { ok: false, error: "File type not allowed" };
  if (size > MAX_PRODUCT_SIZE) return { ok: false, error: "File too large (max 50MB)" };
  return { ok: true };
}

export function validateAvatarUpload(
  mime: string,
  size: number
): { ok: boolean; error?: string } {
  if (!AVATAR_MIMES.has(mime)) return { ok: false, error: "Avatar must be PNG, JPG, WebP or GIF" };
  if (size > MAX_AVATAR_SIZE) return { ok: false, error: "Avatar too large (max 2MB)" };
  return { ok: true };
}

export function validateCoverUpload(mime: string, size: number): { ok: boolean; error?: string } {
  if (!COVER_MIMES.has(mime)) return { ok: false, error: "Cover must be PNG, JPG or WebP" };
  if (size > MAX_COVER_SIZE) return { ok: false, error: "Cover too large (max 5MB)" };
  return { ok: true };
}

export async function getCoverUploadUrl(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from("avatars")
    .createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "Failed to create upload URL");
  return data.signedUrl;
}

export function getCoverPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function getSignedUploadUrl(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from("products")
    .createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "Failed to create upload URL");
  return data.signedUrl;
}

export async function getSignedDownloadUrl(
  path: string,
  expiresIn = 86400
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from("products")
    .createSignedUrl(path, expiresIn);
  if (error || !data) throw new Error(error?.message ?? "Failed to create download URL");
  return data.signedUrl;
}

export async function deleteFile(path: string): Promise<void> {
  await supabaseAdmin.storage.from("product-files").remove([path]);
}
