import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runExport } from "@/lib/export-service";
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
  const exportType = body.exportType as string;
  const validTypes = [
    "PLAN_PDF",
    "INSPECTION_REPORT",
    "CORRECTIVE_ACTION_REGISTER",
    "TRAINING_LOG",
    "CONTAINER_INVENTORY",
    "CONTAINMENT_BASIS",
    "REVIEW_MEMO",
    "INCIDENT_LOG",
    "FULL_AUDIT_PACK",
  ];
  if (!validTypes.includes(exportType)) {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }

  try {
    const jobId = await runExport(
      facilityId,
      exportType as "PLAN_PDF" | "INSPECTION_REPORT" | "CORRECTIVE_ACTION_REGISTER" | "TRAINING_LOG" | "CONTAINER_INVENTORY" | "CONTAINMENT_BASIS" | "REVIEW_MEMO" | "INCIDENT_LOG" | "FULL_AUDIT_PACK",
      session.user.id
    );

    await recordAuditEvent({
      organizationId: facility.organizationId,
      facilityId,
      actorUserId: session.user.id,
      objectType: "ExportJob",
      objectId: jobId,
      action: "export.generated",
      afterJson: { exportType },
    });

    const job = await prisma.exportJob.findUnique({
      where: { id: jobId },
      include: { artifacts: true },
    });

    return NextResponse.json({ job });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
