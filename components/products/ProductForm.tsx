"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "./FileUpload";
import type { Product } from "@/types";

type UploadResult = { path: string; name: string; size: number; mime: string };

type Props = { product?: Product };

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(
    product ? (product.price / 100).toString() : ""
  );
  const [file, setFile] = useState<UploadResult | null>(
    product?.file_path
      ? {
          path: product.file_path,
          name: product.file_name ?? "",
          size: product.file_size ?? 0,
          mime: product.file_mime ?? "",
        }
      : null
  );
  const [published, setPublished] = useState(product?.is_published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      file_path: file?.path ?? null,
      file_name: file?.name ?? null,
      file_size: file?.size ?? null,
      file_mime: file?.mime ?? null,
      is_published: published,
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
      <div className="space-y-2">
        <Label>Product file</Label>
        <FileUpload
          onUploaded={setFile}
          existingFile={file ? { name: file.name } : null}
        />
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
