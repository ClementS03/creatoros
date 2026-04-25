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

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export function validateUpload(
  mime: string,
  size: number
): { ok: boolean; error?: string } {
  if (!ALLOWED_MIMES.has(mime)) return { ok: false, error: "File type not allowed" };
  if (size > MAX_FILE_SIZE) return { ok: false, error: "File too large (max 500MB)" };
  return { ok: true };
}

export async function getSignedUploadUrl(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from("product-files")
    .createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "Failed to create upload URL");
  return data.signedUrl;
}

export async function getSignedDownloadUrl(
  path: string,
  expiresIn = 86400
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from("product-files")
    .createSignedUrl(path, expiresIn);
  if (error || !data) throw new Error(error?.message ?? "Failed to create download URL");
  return data.signedUrl;
}

export async function deleteFile(path: string): Promise<void> {
  await supabaseAdmin.storage.from("product-files").remove([path]);
}
