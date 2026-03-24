import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RequirementSourceType } from "@/generated/prisma/enums";

async function checkAccess(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
    select: { organizationId: true },
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

  const requirements = await prisma.regulatoryRequirement.findMany({
    where: {
      organizationId: facility.organizationId,
      active: true,
    },
    orderBy: { requirementCode: "asc" },
    select: {
      id: true,
      requirementCode: true,
      title: true,
      sourceType: true,
      citationRef: true,
    },
  });

  return NextResponse.json({ requirements });
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

  const requirement = await prisma.regulatoryRequirement.create({
    data: {
      organizationId: facility.organizationId,
      requirementCode: body.requirementCode,
      title: body.title,
      sourceType: (body.sourceType as RequirementSourceType) ?? "REGULATION",
      citationRef: body.citationRef || null,
      controllingSection: body.controllingSection || null,
      summary: body.summary || null,
      evidenceRequirementsJson: body.evidenceRequirementsJson ?? undefined,
      severityModel: body.severityModel || null,
      active: true,
    },
  });

  return NextResponse.json({ requirement });
}
