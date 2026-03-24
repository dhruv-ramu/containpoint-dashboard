import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { approvePlanVersion } from "@/lib/plan-service";
import { recordAuditEvent } from "@/lib/audit";
import type { PlanCertificationType } from "@/generated/prisma/enums";

async function checkAccess(facilityId: string, userId: string) {
  const facility = await prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
    select: { id: true, organizationId: true },
  });
  return facility;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ facilityId: string; versionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, versionId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = await prisma.planVersion.findFirst({
    where: { id: versionId, facilityId },
    include: {
      sections: { orderBy: { sectionOrder: "asc" } },
      certifications: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  });

  if (!version) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ version });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ facilityId: string; versionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, versionId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = await prisma.planVersion.findFirst({
    where: { id: versionId, facilityId },
  });
  if (!version) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (version.status !== "DRAFT" && version.status !== "IN_REVIEW") {
    return NextResponse.json({ error: "Version is locked" }, { status: 400 });
  }

  const body = await req.json();

  if (body.approve && body.certification) {
    await approvePlanVersion(versionId, session.user.id, {
      certificationType: body.certification.certificationType as PlanCertificationType,
      certifiedByName: body.certification.certifiedByName,
      certifiedByTitle: body.certification.certifiedByTitle,
      certificationDate: new Date(body.certification.certificationDate),
      siteVisitDate: body.certification.siteVisitDate
        ? new Date(body.certification.siteVisitDate)
        : undefined,
      notes: body.certification.notes,
    });

    await recordAuditEvent({
      organizationId: facility.organizationId,
      facilityId,
      actorUserId: session.user.id,
      objectType: "PlanVersion",
      objectId: versionId,
      action: "plan.approved",
      afterJson: { status: "APPROVED" },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
