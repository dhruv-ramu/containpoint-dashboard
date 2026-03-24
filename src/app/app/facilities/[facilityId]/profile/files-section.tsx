import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { FileIcon } from "lucide-react";

type File = {
  id: string;
  fileName: string;
  caption: string | null;
  uploadedAt: Date;
};

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
                  <span className="font-medium truncate block">{f.fileName}</span>
                  {f.caption && (
                    <span className="text-[var(--muted)] text-xs">{f.caption}</span>
                  )}
                </div>
                <span className="text-[var(--muted)] text-xs shrink-0">
                  {new Date(f.uploadedAt).toLocaleDateString()}
                </span>
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
