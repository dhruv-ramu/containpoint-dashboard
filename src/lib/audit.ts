import { prisma } from "@/lib/db";

type AuditAction =
  | "facility.created"
  | "applicability.assessed"
  | "qualification.assessed"
  | "accountable_person.saved"
  | "asset.created"
  | "asset.updated"
  | "containment.created"
  | "containment.updated"
  | "file.uploaded"
  | "profile.updated";

type AuditParams = {
  organizationId?: string;
  facilityId?: string;
  actorUserId?: string;
  objectType: string;
  objectId?: string;
  action: AuditAction;
  beforeJson?: unknown;
  afterJson?: unknown;
};

export async function recordAuditEvent(params: AuditParams) {
  await prisma.auditEvent.create({
    data: {
      organizationId: params.organizationId ?? null,
      facilityId: params.facilityId ?? null,
      actorUserId: params.actorUserId ?? null,
      objectType: params.objectType,
      objectId: params.objectId ?? null,
      action: params.action,
      beforeJson: params.beforeJson ? (params.beforeJson as object) : null,
      afterJson: params.afterJson ? (params.afterJson as object) : null,
    },
  });
}
