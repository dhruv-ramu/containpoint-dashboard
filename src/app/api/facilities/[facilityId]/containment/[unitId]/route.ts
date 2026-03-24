import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { ContainmentType } from "@/generated/prisma/enums";

async function checkAccess(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ facilityId: string; unitId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, unitId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const unit = await prisma.containmentUnit.findFirst({
    where: { id: unitId, facilityId },
  });
  if (!unit) {
    return NextResponse.json({ error: "Containment unit not found" }, { status: 404 });
  }

  const body = await req.json();

  if (body.code && body.code !== unit.code) {
    const existing = await prisma.containmentUnit.findUnique({
      where: { facilityId_code: { facilityId, code: body.code } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Code already exists in this facility" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.containmentUnit.update({
    where: { id: unitId },
    data: {
      code: body.code ?? undefined,
      name: body.name ?? undefined,
      containmentType: body.containmentType ?? undefined,
      largestSingleTankCapacityGallons: body.largestSingleTankCapacityGallons ?? undefined,
      capacityCalculationMethod: body.capacityCalculationMethod ?? undefined,
      calculatedCapacityGallons: body.calculatedCapacityGallons ?? undefined,
      drainageControlNotes: body.drainageControlNotes ?? undefined,
      conditionStatus: body.conditionStatus ?? undefined,
      lastInspectionDate: body.lastInspectionDate
        ? new Date(body.lastInspectionDate)
        : undefined,
      comments: body.comments ?? undefined,
    },
  });

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "ContainmentUnit",
    objectId: unitId,
    action: "containment.updated",
    afterJson: { code: updated.code, name: updated.name },
  });

  return NextResponse.json({ success: true });
}
