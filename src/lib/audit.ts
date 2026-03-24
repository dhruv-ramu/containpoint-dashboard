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
  | "profile.updated"
  // Phase 2
  | "inspection_template.created"
  | "inspection_template.updated"
  | "inspection.completed"
  | "inspection.signed"
  | "corrective_action.created"
  | "corrective_action.updated"
  | "training_event.created"
  | "obligation.created"
  | "obligation.resolved"
  | "validation.result_changed";

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
      beforeJson: params.beforeJson ?? undefined,
      afterJson: params.afterJson ?? undefined,
    },
  });
}
