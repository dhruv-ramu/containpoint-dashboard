"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

type Props = {
  facilityId: string;
  objectType: "FACILITY" | "ASSET" | "CONTAINMENT_UNIT";
  objectId: string;
  onUploaded?: () => void;
};

export function FileUpload({ facilityId, objectType, objectId, onUploaded }: Props) {
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
      <Label>Upload file</Label>
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Choose file"}
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
