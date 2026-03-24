import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { AssetType, AssetClass, AssetModeState } from "@/generated/prisma/enums";

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
  { params }: { params: Promise<{ facilityId: string; assetId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, assetId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, facilityId },
  });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const body = await req.json();

  if (body.assetCode && body.assetCode !== asset.assetCode) {
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
  }

  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: {
      assetCode: body.assetCode ?? undefined,
      name: body.name ?? undefined,
      assetType: body.assetType ?? undefined,
      oilTypeId: body.oilTypeId ?? undefined,
      storageCapacityGallons: body.storageCapacityGallons ?? undefined,
      typicalFillPercent: body.typicalFillPercent ?? undefined,
      countedTowardThreshold: body.countedTowardThreshold ?? undefined,
      exclusionReason: body.exclusionReason ?? undefined,
      aboveground: body.aboveground ?? undefined,
      indoor: body.indoor ?? undefined,
      status: body.status ?? undefined,
      installDate: body.installDate ? new Date(body.installDate) : undefined,
      retirementDate: body.retirementDate ? new Date(body.retirementDate) : undefined,
      manufacturer: body.manufacturer ?? undefined,
      material: body.material ?? undefined,
      dimensions: body.dimensions ?? undefined,
      overfillProtectionNotes: body.overfillProtectionNotes ?? undefined,
      integrityTestingBasis: body.integrityTestingBasis ?? undefined,
      inspectionFrequencyDays: body.inspectionFrequencyDays ?? undefined,
      comments: body.comments ?? undefined,
      assetClass: body.assetClass !== undefined ? (body.assetClass as AssetClass | null) : undefined,
      modeState: body.modeState !== undefined ? (body.modeState as AssetModeState | null) : undefined,
      requiresSizedContainment: body.requiresSizedContainment ?? undefined,
      underDirectControl: body.underDirectControl ?? undefined,
      containmentValidationBasis: body.containmentValidationBasis ?? undefined,
    },
  });

  if (Array.isArray(body.containmentUnitIds)) {
    await prisma.assetContainmentLink.deleteMany({ where: { assetId } });
    if (body.containmentUnitIds.length) {
      await prisma.assetContainmentLink.createMany({
        data: body.containmentUnitIds.map((cid: string) => ({
          assetId,
          containmentUnitId: cid,
        })),
        skipDuplicates: true,
      });
    }
  }

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "Asset",
    objectId: assetId,
    action: "asset.updated",
    afterJson: { assetCode: updated.assetCode, name: updated.name },
  });

  return NextResponse.json({ success: true });
}
