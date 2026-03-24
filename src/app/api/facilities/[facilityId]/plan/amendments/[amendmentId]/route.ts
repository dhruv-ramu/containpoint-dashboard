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

const VALID_STATUSES = ["OPEN", "DRAFTING", "READY_FOR_APPROVAL", "IMPLEMENTED", "CLOSED"];

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ facilityId: string; amendmentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, amendmentId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const amendment = await prisma.planAmendment.findFirst({
    where: { id: amendmentId, facilityId },
  });
  if (!amendment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (VALID_STATUSES.includes(body.status)) {
    updates.status = body.status;
    if (body.status === "IMPLEMENTED" || body.status === "CLOSED") {
      updates.completedAt = new Date();
      updates.implementedBy = session.user.id;
    }
  }
  if (body.description !== undefined) updates.description = body.description;
  if (body.dueBy !== undefined) updates.dueBy = body.dueBy ? new Date(body.dueBy) : null;
  if (body.planVersionId !== undefined) updates.planVersionId = body.planVersionId || null;

  const updated = await prisma.planAmendment.update({
    where: { id: amendmentId },
    data: updates as Record<string, string | Date | null>,
  });

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "PlanAmendment",
    objectId: amendmentId,
    action: "plan_amendment.updated",
    afterJson: updates,
  });

  return NextResponse.json({ amendment: updated });
}
