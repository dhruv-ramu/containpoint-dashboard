import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { AssetClass, InspectionType, CorrectiveActionSeverity } from "@/generated/prisma/enums";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ facilityId: string; templateId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, templateId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const template = await prisma.inspectionTemplate.findFirst({
    where: {
      id: templateId,
      organizationId: facility.organizationId,
      OR: [{ facilityId: null }, { facilityId }],
    },
    include: {
      versions: {
        where: { active: true },
        orderBy: { version: "desc" },
        take: 1,
        include: {
          items: { orderBy: { sequenceOrder: "asc" } },
        },
      },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ template });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ facilityId: string; templateId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, templateId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.inspectionTemplate.findFirst({
    where: {
      id: templateId,
      organizationId: facility.organizationId,
      OR: [{ facilityId: null }, { facilityId }],
    },
    include: {
      versions: {
        where: { active: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  await prisma.inspectionTemplate.update({
    where: { id: templateId },
    data: {
      name: body.name ?? existing.name,
      assetClass: (body.assetClass as AssetClass) ?? existing.assetClass,
      inspectionType: (body.inspectionType as InspectionType) ?? existing.inspectionType,
      standardBasisRef: body.standardBasisRef ?? existing.standardBasisRef,
      procedureText: body.procedureText ?? existing.procedureText,
      expectedFrequencyDays: body.expectedFrequencyDays ?? existing.expectedFrequencyDays,
      performerQualificationBasis:
        body.performerQualificationBasis ?? existing.performerQualificationBasis,
      requiredEvidenceTypes: body.requiredEvidenceTypes
        ? JSON.stringify(body.requiredEvidenceTypes)
        : existing.requiredEvidenceTypes,
    },
  });

  const activeVersion = existing.versions[0];
  if (activeVersion && body.items != null) {
    await prisma.inspectionTemplateItem.deleteMany({
      where: { templateVersionId: activeVersion.id },
    });

    const items = body.items as Array<{
      prompt: string;
      responseType: string;
      required?: boolean;
      acceptableRange?: string | null;
      failureSeverity?: string | null;
      regulatoryRequirementId?: string | null;
      autoCreateCorrectiveAction?: boolean;
    }>;

    if (items.length) {
      await prisma.inspectionTemplateItem.createMany({
        data: items.map((it, i) => ({
          templateVersionId: activeVersion.id,
          sequenceOrder: i + 1,
          prompt: it.prompt,
          responseType: it.responseType,
          required: it.required ?? false,
        acceptableRange: it.acceptableRange || null,
        failureSeverity: (it.failureSeverity as CorrectiveActionSeverity) || null,
          regulatoryRequirementId: it.regulatoryRequirementId || null,
          autoCreateCorrectiveAction: it.autoCreateCorrectiveAction ?? false,
        })),
      });
    }
  }

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId: facility.id,
    actorUserId: session.user.id,
    objectType: "InspectionTemplate",
    objectId: templateId,
    action: "inspection_template.updated",
    afterJson: { name: body.name ?? existing.name },
  });

  return NextResponse.json({ templateId });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ facilityId: string; templateId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, templateId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.inspectionTemplate.findFirst({
    where: {
      id: templateId,
      organizationId: facility.organizationId,
      OR: [{ facilityId: null }, { facilityId }],
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.inspectionTemplate.update({
    where: { id: templateId },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
