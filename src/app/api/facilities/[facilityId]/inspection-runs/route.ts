import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

async function checkAccess(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
    select: { id: true, organizationId: true },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    scheduledInspectionId,
    performedByNameSnapshot,
    performedByRoleSnapshot,
    qualificationBasis,
    standardBasisRef,
    procedureTextSnapshot,
    itemResults,
    signAndLock,
    signerName,
    signerRole,
    signatureData,
  } = body;

  const scheduled = await prisma.scheduledInspection.findFirst({
    where: { id: scheduledInspectionId, facilityId },
    include: { template: true },
  });

  if (!scheduled) {
    return NextResponse.json({ error: "Scheduled inspection not found" }, { status: 404 });
  }

  const run = await prisma.inspectionRun.create({
    data: {
      scheduledInspectionId,
      facilityId,
      performedByUserId: session.user.id,
      performedByNameSnapshot: performedByNameSnapshot ?? session.user.name ?? "Unknown",
      performedByRoleSnapshot: performedByRoleSnapshot ?? "INSPECTOR",
      qualificationBasis: qualificationBasis ?? null,
      performedAt: new Date(),
      performedAtTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      standardBasisRef: standardBasisRef ?? scheduled.template.standardBasisRef,
      procedureTextSnapshot: procedureTextSnapshot ?? scheduled.template.procedureText,
      status: signAndLock ? "completed" : "in_progress",
      locked: !!signAndLock,
    },
  });

  const results = itemResults as Array<{
    templateItemId: string;
    responseValue: unknown;
    pass: boolean;
    notes?: string;
  }>;

  for (const r of results ?? []) {
    await prisma.inspectionItemResult.create({
      data: {
        inspectionRunId: run.id,
        templateItemId: r.templateItemId,
        responseValue: r.responseValue ?? undefined,
        pass: r.pass,
        notes: r.notes ?? null,
      },
    });

    if (r.pass === false) {
      const item = await prisma.inspectionTemplateItem.findUnique({
        where: { id: r.templateItemId },
        include: { regulatoryRequirement: true },
      });
      if (item?.autoCreateCorrectiveAction) {
        await prisma.correctiveAction.create({
          data: {
            facilityId,
            assetId: scheduled.assetId ?? null,
            regulatoryRequirementId: item.regulatoryRequirementId ?? null,
            sourceInspectionItemId: item.id,
            sourceInspectionRunId: run.id,
            title: `Inspection failure: ${item.prompt.slice(0, 80)}${item.prompt.length > 80 ? "…" : ""}`,
            description: r.notes ?? item.prompt,
            severity: item.failureSeverity ?? "MEDIUM",
            triggerCategory: "inspection_failure",
            ownerUserId: session.user.id,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: "OPEN",
          },
        });
      }
    }
  }

  if (signAndLock && signerName) {
    await prisma.inspectionSignature.create({
      data: {
        inspectionRunId: run.id,
        signerUserId: session.user.id,
        signerName,
        signerRole: signerRole ?? null,
        signedAt: new Date(),
        signatureData: signatureData ?? null,
      },
    });

    await prisma.scheduledInspection.update({
      where: { id: scheduledInspectionId },
      data: { status: "completed" },
    });

    await recordAuditEvent({
      organizationId: facility.organizationId,
      facilityId,
      actorUserId: session.user.id,
      objectType: "InspectionRun",
      objectId: run.id,
      action: "inspection.signed",
      afterJson: { locked: true },
    });
  }

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "InspectionRun",
    objectId: run.id,
    action: "inspection.completed",
    afterJson: { itemCount: results?.length ?? 0, locked: !!signAndLock },
  });

  return NextResponse.json({ inspectionRunId: run.id, locked: !!signAndLock });
}
