import { AttachmentsSection } from "@/components/attachments-section";

type File = {
  id: string;
  fileName: string;
  mimeType: string;
  caption: string | null;
  uploadedAt: Date;
};

type Props = {
  facilityId: string;
  files: File[];
};

export function FacilityFilesSection({ facilityId, files }: Props) {
  return (
    <AttachmentsSection
      facilityId={facilityId}
      objectType="FACILITY"
      objectId={facilityId}
      files={files}
      title="Photos & attachments"
      subtitle="Attach optional facility photos, plans, calculations, and documents"
      photosEmphasis={false}
    />
  );
}
