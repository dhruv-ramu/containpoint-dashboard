import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { FileIcon } from "lucide-react";

type File = {
  id: string;
  fileName: string;
  caption: string | null;
  uploadedAt: Date;
};

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

type Props = {
  facilityId: string;
  files: File[];
};

export function FacilityFilesSection({ facilityId, files }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>File attachments</CardTitle>
        <p className="text-sm text-[var(--muted)]">
          Attach plans, calculations, and other documents
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUpload
          facilityId={facilityId}
          objectType="FACILITY"
          objectId={facilityId}
        />
        {files.length > 0 ? (
          <ul className="border-t pt-4 space-y-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 text-sm py-1"
              >
                <FileIcon className="h-4 w-4 text-[var(--muted)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <a
                    href={`/api/facilities/${facilityId}/files/${f.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium truncate block hover:underline text-[var(--foreground)]"
                  >
                    {f.fileName}
                  </a>
                  {f.caption && (
                    <span className="text-[var(--muted)] text-xs">{f.caption}</span>
                  )}
                </div>
                <span className="text-[var(--muted)] text-xs shrink-0">
                  {new Date(f.uploadedAt).toLocaleDateString()}
                </span>
                <a
                  href={`/api/facilities/${facilityId}/files/${f.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1 rounded hover:bg-[var(--mist-gray)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label={`Download ${f.fileName}`}
                >
                  <DownloadIcon />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted)] pt-2">No files attached yet</p>
        )}
      </CardContent>
    </Card>
  );
}
