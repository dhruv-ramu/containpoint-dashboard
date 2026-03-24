"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { FileIcon, ImageIcon } from "lucide-react";
import type { FileObjectType } from "@/generated/prisma/enums";

type FileItem = {
  id: string;
  fileName: string;
  mimeType: string;
  caption: string | null;
  uploadedAt: Date;
};

type Props = {
  facilityId: string;
  objectType: FileObjectType;
  objectId: string;
  files: FileItem[];
  title?: string;
  subtitle?: string;
  /** When true, emphasize photos (image picker, thumbnails) */
  photosEmphasis?: boolean;
};

function isImage(mimeType: string): boolean {
  return /^image\//.test(mimeType);
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function AttachmentsSection({
  facilityId,
  objectType,
  objectId,
  files,
  title = "Photos & attachments",
  subtitle = "Add optional photos or documents",
  photosEmphasis = true,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {photosEmphasis ? (
            <ImageIcon className="h-5 w-5 text-[var(--steel-blue)]" />
          ) : (
            <FileIcon className="h-5 w-5 text-[var(--steel-blue)]" />
          )}
          {title}
        </CardTitle>
        <p className="text-sm text-[var(--muted)]">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUpload
          facilityId={facilityId}
          objectType={objectType}
          objectId={objectId}
          photosOnly={photosEmphasis}
        />
        {files.length > 0 ? (
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((f) => {
                const img = isImage(f.mimeType);
                const fileUrl = `/api/facilities/${facilityId}/files/${f.id}`;
                return (
                  <a
                    key={f.id}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--mist-gray)]/30 hover:border-[var(--steel-blue)]/50 transition-colors"
                  >
                    {img ? (
                      <div className="aspect-square bg-[var(--mist-gray)] relative">
                        <img
                          src={fileUrl}
                          alt={f.caption || f.fileName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square flex items-center justify-center bg-[var(--mist-gray)]">
                        <FileIcon className="h-10 w-10 text-[var(--muted)]" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium truncate" title={f.fileName}>
                        {f.fileName}
                      </p>
                      {f.caption && (
                        <p className="text-xs text-[var(--muted)] truncate" title={f.caption}>
                          {f.caption}
                        </p>
                      )}
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">
                        {new Date(f.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)] pt-2">No attachments yet</p>
        )}
      </CardContent>
    </Card>
  );
}
