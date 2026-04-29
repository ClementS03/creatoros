"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "./FileUpload";
import { File, X, Plus } from "lucide-react";
import type { Product } from "@/types";

type UploadResult = { path: string; name: string; size: number; mime: string };

type Props = { product?: Product };

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? (product.price / 100).toString() : "");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      name,
      description,
      price: Math.round(parseFloat(price || "0") * 100),
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
        <Label htmlFor="name">Product name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="My awesome template"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <textarea
          id="desc"
          className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's included?"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Price (USD)</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0 for free"
        />
      </div>

      {/* Files */}
      <div className="space-y-2">
        <Label>Files <span className="text-muted-foreground font-normal">({files.length} uploaded)</span></Label>

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
