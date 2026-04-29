"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "./FileUpload";
import { File, X, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/types";

type UploadResult = { path: string; name: string; size: number; mime: string };

type Props = { product?: Product };

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [regularPrice, setRegularPrice] = useState(() => {
    if (!product) return "";
    const base = product.compare_at_price ?? product.price;
    return (base / 100).toString();
  });
  const [discountPct, setDiscountPct] = useState(() => {
    if (!product?.compare_at_price || product.compare_at_price <= product.price) return "";
    return Math.round((1 - product.price / product.compare_at_price) * 100).toString();
  });
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(product?.cover_image_url ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [published, setPublished] = useState(product?.is_published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  // Initialize files from product_files (new) or legacy file_path (old)
  const [files, setFiles] = useState<UploadResult[]>(() => {
    if (product?.product_files && product.product_files.length > 0) {
      return product.product_files
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(f => ({ path: f.file_path, name: f.file_name, size: f.file_size ?? 0, mime: f.file_mime ?? "" }));
    }
    if (product?.file_path) {
      return [{ path: product.file_path, name: product.file_name ?? "", size: product.file_size ?? 0, mime: product.file_mime ?? "" }];
    }
    return [];
  });

  function handleFileUploaded(result: UploadResult) {
    if (!result.path) return;
    setFiles(prev => [...prev, result]);
    setUploadKey(k => k + 1);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const res = await fetch("/api/upload/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mime: file.type, size: file.size, filename: file.name }),
    });
    if (!res.ok) { setCoverUploading(false); return; }
    const { signedUrl, path } = await res.json() as { signedUrl: string; path: string };
    await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    // Construct public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
    setCoverImageUrl(publicUrl);
    setCoverUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { setError("Description is required."); return; }
    if (files.length === 0) { setError("At least one file is required."); return; }
    setSaving(true);
    setError(null);

    const reg = parseFloat(regularPrice || "0");
    const pct = parseFloat(discountPct || "0");
    const salePrice = pct > 0 ? reg * (1 - pct / 100) : reg;
    const body = {
      name,
      description,
      price: Math.round(salePrice * 100),
      compare_at_price: pct > 0 ? Math.round(reg * 100) : null,
      cover_image_url: coverImageUrl,
      currency: "usd",
      type: "digital" as const,
      is_published: published,
      files: files.map(f => ({ path: f.path, name: f.name, size: f.size, mime: f.mime })),
    };

    const res = await fetch(
      product ? `/api/products/${product.id}` : "/api/products",
      {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const { error } = await res.json() as { error: string };
      setError(error ?? "Failed to save");
      setSaving(false);
      return;
    }
    router.push("/dashboard/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="name">Product name <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="My awesome template"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Description <span className="text-destructive">*</span></Label>
        <textarea
          id="desc"
          className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's included?"
        />
      </div>
      {/* Cover image */}
      <div className="space-y-2">
        <Label>Cover image <span className="text-muted-foreground font-normal text-xs">(optional, max 5MB)</span></Label>
        <div className="flex items-start gap-4">
          {/* Thumbnail preview */}
          <div className="shrink-0 w-24 h-24 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
            {coverImageUrl ? (
              <Image src={coverImageUrl} alt="Cover" width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <ImageIcon size={24} className="text-muted-foreground" />
            )}
          </div>
          {/* Upload / remove */}
          <div className="flex-1 space-y-2">
            {coverImageUrl ? (
              <button
                type="button"
                onClick={() => setCoverImageUrl(null)}
                className="flex items-center gap-1.5 text-sm text-destructive hover:underline"
              >
                <X size={13} /> Remove image
              </button>
            ) : (
              <label className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-lg text-sm transition-colors ${coverUploading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-accent"}`}>
                {coverUploading
                  ? <Loader2 size={15} className="text-primary animate-spin shrink-0" />
                  : <ImageIcon size={15} className="text-muted-foreground shrink-0" />
                }
                <span className="text-muted-foreground">
                  {coverUploading ? "Uploading…" : "Upload cover (PNG, JPG, WebP)"}
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverUpload} disabled={coverUploading} />
              </label>
            )}
            <p className="text-xs text-muted-foreground">Recommended: 1:1 square, min 400×400px</p>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="price">Price (USD) <span className="text-destructive">*</span></Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={regularPrice}
              onChange={(e) => setRegularPrice(e.target.value)}
              placeholder="0 for free"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">Discount <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <div className="relative">
              <Input
                id="discount"
                type="number"
                min="0"
                max="99"
                step="1"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                placeholder="0"
                className="pr-7"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
            </div>
          </div>
        </div>
        {/* Live preview */}
        {(() => {
          const reg = parseFloat(regularPrice || "0");
          const pct = parseFloat(discountPct || "0");
          if (reg <= 0) return null;
          const sale = pct > 0 ? reg * (1 - pct / 100) : reg;
          return (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5">
              <span className="font-bold text-base">${sale.toFixed(2)}</span>
              {pct > 0 && (
                <>
                  <span className="text-sm text-muted-foreground line-through">${reg.toFixed(2)}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    -{Math.round(pct)}%
                  </span>
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* Files */}
      <div className="space-y-2">
        <Label>Files <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal">({files.length} uploaded)</span></Label>

        {/* Uploaded files list */}
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
            <File size={15} className="text-muted-foreground shrink-0" />
            <span className="text-sm flex-1 truncate">{f.name}</span>
            {f.size > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                {(f.size / 1024 / 1024).toFixed(1)} MB
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={() => removeFile(i)} type="button" className="shrink-0 h-7 w-7">
              <X size={13} />
            </Button>
          </div>
        ))}

        {/* Upload widget — always visible to add more */}
        <FileUpload key={uploadKey} onUploaded={handleFileUploaded} existingFile={null} />
        {files.length > 0 && (
          <p className="text-xs text-muted-foreground">Upload another file above to add it to the product.</p>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm">Publish on storefront</span>
      </label>
      <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Required fields</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
