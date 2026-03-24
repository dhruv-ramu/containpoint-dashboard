"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, Upload } from "lucide-react";
import type { FileObjectType } from "@/generated/prisma/enums";

type Props = {
  facilityId: string;
  objectType: FileObjectType;
  objectId: string;
  onUploaded?: () => void;
  /** When true, file picker defaults to images only (optional filter) */
  photosOnly?: boolean;
  /** Override button label */
  label?: string;
};

export function FileUpload({ facilityId, objectType, objectId, onUploaded, photosOnly, label }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("objectType", objectType);
      formData.set("objectId", objectId);
      if (caption) formData.set("caption", caption);

      const res = await fetch(`/api/facilities/${facilityId}/files`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(typeof err.error === "string" ? err.error : "Upload failed");
        return;
      }

      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
      onUploaded?.();
    } catch {
      setError("An error occurred");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label ?? (photosOnly ? "Add photo (optional)" : "Upload file (optional)")}</Label>
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="file"
          accept={photosOnly ? "image/jpeg,image/png,image/gif,image/webp" : undefined}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          aria-label={photosOnly ? "Add photo" : "Choose file to upload"}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {photosOnly ? (
            <ImagePlus className="h-4 w-4 mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? "Uploading..." : photosOnly ? "Add photo" : "Choose file"}
        </Button>
        <Input
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="max-w-xs"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
