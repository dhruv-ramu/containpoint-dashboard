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
  });
}

export async function PUT(
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

  const profile = await prisma.facilityProfile.upsert({
    where: { facilityId },
    create: {
      facilityId,
      legalName: body.legalName || null,
      dbaName: body.dbaName || null,
      addressLine1: body.addressLine1 || null,
      addressLine2: body.addressLine2 || null,
      city: body.city || null,
      state: body.state || null,
      postalCode: body.postalCode || null,
      country: body.country || "US",
      naicsCode: body.naicsCode || null,
      industry: body.industry || null,
      dischargeExpectationNarrative: body.dischargeExpectationNarrative || null,
      nearestWaterbody: body.nearestWaterbody || null,
      operatingHours: body.operatingHours || null,
      consultantOfRecord: body.consultantOfRecord || null,
      emergencyContactName: body.emergencyContactName || null,
      emergencyContactPhone: body.emergencyContactPhone || null,
      currentPlanEffectiveDate: body.currentPlanEffectiveDate
        ? new Date(body.currentPlanEffectiveDate)
        : null,
      nextFiveYearReviewDate: body.nextFiveYearReviewDate
        ? new Date(body.nextFiveYearReviewDate)
        : null,
    },
    update: {
      legalName: body.legalName ?? undefined,
      dbaName: body.dbaName ?? undefined,
      addressLine1: body.addressLine1 ?? undefined,
      addressLine2: body.addressLine2 ?? undefined,
      city: body.city ?? undefined,
      state: body.state ?? undefined,
      postalCode: body.postalCode ?? undefined,
      country: body.country ?? undefined,
      naicsCode: body.naicsCode ?? undefined,
      industry: body.industry ?? undefined,
      dischargeExpectationNarrative: body.dischargeExpectationNarrative ?? undefined,
      nearestWaterbody: body.nearestWaterbody ?? undefined,
      operatingHours: body.operatingHours ?? undefined,
      consultantOfRecord: body.consultantOfRecord ?? undefined,
      emergencyContactName: body.emergencyContactName ?? undefined,
      emergencyContactPhone: body.emergencyContactPhone ?? undefined,
      currentPlanEffectiveDate: body.currentPlanEffectiveDate
        ? new Date(body.currentPlanEffectiveDate)
        : undefined,
      nextFiveYearReviewDate: body.nextFiveYearReviewDate
        ? new Date(body.nextFiveYearReviewDate)
        : undefined,
    },
  });

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "FacilityProfile",
    objectId: profile.id,
    action: "profile.updated",
  });

  return NextResponse.json({ success: true });
}
