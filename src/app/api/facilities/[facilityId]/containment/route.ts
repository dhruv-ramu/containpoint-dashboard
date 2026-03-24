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

  const existing = await prisma.containmentUnit.findUnique({
    where: { facilityId_code: { facilityId, code: body.code } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Code already exists in this facility" },
      { status: 400 }
    );
  }

  const unit = await prisma.containmentUnit.create({
    data: {
      facilityId,
      code: body.code,
      name: body.name,
      containmentType: body.containmentType as ContainmentType,
      largestSingleTankCapacityGallons: body.largestSingleTankCapacityGallons ?? null,
      capacityCalculationMethod: body.capacityCalculationMethod || null,
      calculatedCapacityGallons: body.calculatedCapacityGallons ?? null,
      drainageControlNotes: body.drainageControlNotes || null,
      conditionStatus: body.conditionStatus ?? null,
      lastInspectionDate: body.lastInspectionDate
        ? new Date(body.lastInspectionDate)
        : null,
      comments: body.comments || null,
    },
  });

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "ContainmentUnit",
    objectId: unit.id,
    action: "containment.created",
    afterJson: { code: unit.code, name: unit.name },
  });

  return NextResponse.json({ unitId: unit.id });
}
