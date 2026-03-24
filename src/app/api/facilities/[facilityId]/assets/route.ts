import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { AssetType } from "@/generated/prisma";

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

  const existing = await prisma.asset.findUnique({
    where: {
      facilityId_assetCode: { facilityId, assetCode: body.assetCode },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Asset code already exists in this facility" },
      { status: 400 }
    );
  }

  const asset = await prisma.asset.create({
    data: {
      facilityId,
      assetCode: body.assetCode,
      name: body.name,
      assetType: body.assetType as AssetType,
      oilTypeId: body.oilTypeId || null,
      storageCapacityGallons: body.storageCapacityGallons ?? null,
      typicalFillPercent: body.typicalFillPercent ?? null,
      countedTowardThreshold: body.countedTowardThreshold ?? true,
      exclusionReason: body.exclusionReason || null,
      aboveground: body.aboveground ?? true,
      indoor: body.indoor ?? null,
      status: body.status ?? "ACTIVE",
      installDate: body.installDate ? new Date(body.installDate) : null,
      retirementDate: body.retirementDate ? new Date(body.retirementDate) : null,
      manufacturer: body.manufacturer || null,
      material: body.material || null,
      dimensions: body.dimensions || null,
      overfillProtectionNotes: body.overfillProtectionNotes || null,
      integrityTestingBasis: body.integrityTestingBasis || null,
      inspectionFrequencyDays: body.inspectionFrequencyDays ?? null,
      comments: body.comments || null,
    },
  });

  if (body.containmentUnitIds?.length) {
    await prisma.assetContainmentLink.createMany({
      data: body.containmentUnitIds.map((cid: string) => ({
        assetId: asset.id,
        containmentUnitId: cid,
      })),
      skipDuplicates: true,
    });
  }

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "Asset",
    objectId: asset.id,
    action: "asset.created",
    afterJson: { assetCode: asset.assetCode, name: asset.name },
  });

  return NextResponse.json({ assetId: asset.id });
}
