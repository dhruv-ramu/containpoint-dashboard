import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { AssetClass, InspectionType } from "@/generated/prisma/enums";

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

  const templates = await prisma.inspectionTemplate.findMany({
    where: {
      organizationId: facility.organizationId,
      OR: [{ facilityId: null }, { facilityId }],
      active: true,
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
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ templates });
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

  const template = await prisma.inspectionTemplate.create({
    data: {
      organizationId: facility.organizationId,
      facilityId: body.facilitySpecific ? facilityId : null,
      name: body.name,
      assetClass: body.assetClass as AssetClass,
      inspectionType: body.inspectionType as InspectionType,
      standardBasisRef: body.standardBasisRef || null,
      procedureText: body.procedureText || null,
      expectedFrequencyDays: body.expectedFrequencyDays ?? null,
      performerQualificationBasis: body.performerQualificationBasis || null,
      requiredEvidenceTypes: body.requiredEvidenceTypes
        ? JSON.stringify(body.requiredEvidenceTypes)
        : null,
      active: true,
    },
  });

  const version = await prisma.inspectionTemplateVersion.create({
    data: {
      templateId: template.id,
      version: 1,
      active: true,
    },
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

  if (items?.length) {
    await prisma.inspectionTemplateItem.createMany({
      data: items.map((it, i) => ({
        templateVersionId: version.id,
        sequenceOrder: i + 1,
        prompt: it.prompt,
        responseType: it.responseType,
        required: it.required ?? false,
        acceptableRange: it.acceptableRange || null,
        failureSeverity: it.failureSeverity || null,
        regulatoryRequirementId: it.regulatoryRequirementId || null,
        autoCreateCorrectiveAction: it.autoCreateCorrectiveAction ?? false,
      })),
    });
  }

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId: facility.id,
    actorUserId: session.user.id,
    objectType: "InspectionTemplate",
    objectId: template.id,
    action: "inspection_template.created",
    afterJson: { name: template.name, assetClass: template.assetClass, itemCount: items?.length ?? 0 },
  });

  return NextResponse.json({ templateId: template.id });
}
