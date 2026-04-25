"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, X } from "lucide-react";

type UploadResult = {
  path: string;
  name: string;
  size: number;
  mime: string;
};

type Props = {
  onUploaded: (result: UploadResult) => void;
  existingFile?: { name: string } | null;
};

export function FileUpload({ onUploaded, existingFile }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mime: file.type, size: file.size, filename: file.name }),
    });

    if (!res.ok) {
      const { error } = await res.json() as { error: string };
      setError(error ?? "Upload failed");
      setUploading(false);
      return;
    }

    const { signedUrl, path } = await res.json() as { signedUrl: string; path: string };
    await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    const result: UploadResult = {
      path,
      name: file.name,
      size: file.size,
      mime: file.type,
    };
    setUploaded(result);
    onUploaded(result);
    setUploading(false);
  }

  function handleClear() {
    setUploaded(null);
    onUploaded({ path: "", name: "", size: 0, mime: "" });
  }

  const display = uploaded ?? existingFile;

  return (
    <div className="space-y-2">
      {display ? (
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <File size={16} className="text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{display.name}</span>
          <Button variant="ghost" size="icon" onClick={handleClear} type="button">
            <X size={14} />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent transition-colors">
          <Upload size={20} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {uploading ? "Uploading…" : "Click to upload your file (max 500MB)"}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
