import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { determineQualification } from "@/lib/qualification";
import { z } from "zod";

async function checkAccess(facilityId: string, userId: string) {
  const facility = await prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
  });
  return facility;
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
  const step = body.step as number;

  if (body.complete && step === 5) {
    await prisma.facility.update({
      where: { id: facilityId },
      data: { status: "ACTIVE" },
    });
    return NextResponse.json({ success: true });
  }

  if (!body.data || typeof step !== "number" || step < 1 || step > 4) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const data = body.data;

  try {
    if (step === 1) {
      await prisma.facility.update({
        where: { id: facilityId },
        data: { name: data.name },
      });
      await prisma.facilityProfile.upsert({
        where: { facilityId },
        create: {
          facilityId,
          addressLine1: data.addressLine1 ?? null,
          addressLine2: data.addressLine2 ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          postalCode: data.postalCode ?? null,
          industry: data.industry ?? null,
          operatingHours: data.operatingHours ?? null,
        },
        update: {
          addressLine1: data.addressLine1 ?? undefined,
          addressLine2: data.addressLine2 ?? undefined,
          city: data.city ?? undefined,
          state: data.state ?? undefined,
          postalCode: data.postalCode ?? undefined,
          industry: data.industry ?? undefined,
          operatingHours: data.operatingHours ?? undefined,
        },
      });
      return NextResponse.json({});
    }

    if (step === 2) {
      const spccApplicable =
        data.nonTransportationRelated &&
        data.aggregateAbovegroundCapacityGallons > 0 &&
        data.hasReasonableExpectationOfDischarge;

      const assessment = await prisma.facilityApplicabilityAssessment.create({
        data: {
          facilityId,
          nonTransportationRelated: data.nonTransportationRelated,
          aggregateAbovegroundCapacityGallons: data.aggregateAbovegroundCapacityGallons,
          completelyBuriedCapacityGallons: data.completelyBuriedCapacityGallons ?? 0,
          hasReasonableExpectationOfDischarge: data.hasReasonableExpectationOfDischarge,
          hasContainersBelow55Excluded: data.hasContainersBelow55Excluded ?? false,
          hasPermanentlyClosedContainersExcluded:
            data.hasPermanentlyClosedContainersExcluded ?? false,
          hasMotivePowerContainersExcluded: data.hasMotivePowerContainersExcluded ?? false,
          hasWastewaterTreatmentExclusions: data.hasWastewaterTreatmentExclusions ?? false,
          spccApplicable,
          notes: data.notes ?? null,
          assessedAt: new Date(),
          assessedByUserId: session.user.id,
        },
      });

      await recordAuditEvent({
        organizationId: facility.organizationId,
        facilityId,
        actorUserId: session.user.id,
        objectType: "FacilityApplicabilityAssessment",
        objectId: assessment.id,
        action: "applicability.assessed",
        afterJson: { spccApplicable },
      });

      return NextResponse.json({ spccApplicable });
    }

    if (step === 3) {
      const applicability = await prisma.facilityApplicabilityAssessment.findFirst({
        where: { facilityId },
        orderBy: { assessedAt: "desc" },
      });

      const spccApplicable = applicability?.spccApplicable ?? false;
      const qualResult = determineQualification({
        spccApplicable,
        aggregateAbovegroundCapacityGallons:
          applicability?.aggregateAbovegroundCapacityGallons ?? 0,
        maxIndividualContainerGallons: data.maxIndividualContainerGallons,
        singleDischargeGt1000Last3Years: data.singleDischargeGt1000Last3Years,
        twoDischargesGt42Within12MonthsLast3Years:
          data.twoDischargesGt42Within12MonthsLast3Years,
      });

      const record = await prisma.facilityQualificationRecord.create({
        data: {
          facilityId,
          qualifiedFacility: qualResult.qualifiedFacility,
          tier: qualResult.tier,
          maxIndividualContainerGallons: data.maxIndividualContainerGallons ?? null,
          singleDischargeGt1000Last3Years: data.singleDischargeGt1000Last3Years,
          twoDischargesGt42Within12MonthsLast3Years:
            data.twoDischargesGt42Within12MonthsLast3Years,
          qualificationRationale: qualResult.rationale,
          v1Fit: qualResult.v1Fit,
          assessedAt: new Date(),
          assessedByUserId: session.user.id,
        },
      });

      await recordAuditEvent({
        organizationId: facility.organizationId,
        facilityId,
        actorUserId: session.user.id,
        objectType: "FacilityQualificationRecord",
        objectId: record.id,
        action: "qualification.assessed",
        afterJson: { tier: qualResult.tier, qualifiedFacility: qualResult.qualifiedFacility },
      });

      return NextResponse.json({
        qualifiedFacility: qualResult.qualifiedFacility,
        tier: qualResult.tier,
        v1Fit: qualResult.v1Fit,
        rationale: qualResult.rationale,
      });
    }

    if (step === 4) {
      await prisma.facilityAccountablePerson.upsert({
        where: { facilityId },
        create: {
          facilityId,
          name: data.name,
          title: data.title ?? null,
          email: data.email,
          phone: data.phone ?? null,
        },
        update: {
          name: data.name,
          title: data.title ?? null,
          email: data.email,
          phone: data.phone ?? null,
        },
      });

      await recordAuditEvent({
        organizationId: facility.organizationId,
        facilityId,
        actorUserId: session.user.id,
        objectType: "FacilityAccountablePerson",
        objectId: facilityId,
        action: "accountable_person.saved",
        afterJson: { name: data.name },
      });

      return NextResponse.json({});
    }
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}
