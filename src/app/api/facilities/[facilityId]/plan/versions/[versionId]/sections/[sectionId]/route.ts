import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function checkAccess(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
    select: { id: true },
  });
}

export async function PUT(
  req: Request,
  {
    params,
  }: { params: Promise<{ facilityId: string; versionId: string; sectionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, versionId, sectionId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const section = await prisma.planSection.findFirst({
    where: { id: sectionId, planVersionId: versionId },
    include: { planVersion: true },
  });
  if (!section || section.planVersion.facilityId !== facilityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (section.planVersion.status !== "DRAFT" && section.planVersion.status !== "IN_REVIEW") {
    return NextResponse.json({ error: "Version is locked" }, { status: 400 });
  }

  const body = await req.json();
  const beforeJson = {
    narrativeText: section.narrativeText,
    structuredDataJson: section.structuredDataJson,
  };

  const updated = await prisma.planSection.update({
    where: { id: sectionId },
    data: {
      narrativeText: body.narrativeText ?? section.narrativeText,
      structuredDataJson: body.structuredDataJson ?? section.structuredDataJson,
      contentMode: body.contentMode ?? section.contentMode,
    },
  });

  const lastRev = await prisma.planSectionRevision.findFirst({
    where: { planSectionId: sectionId },
    orderBy: { revisionNumber: "desc" },
    select: { revisionNumber: true },
  });
  const nextRevNum = (lastRev?.revisionNumber ?? 0) + 1;

  await prisma.planSectionRevision.create({
    data: {
      planSectionId: sectionId,
      revisionNumber: nextRevNum,
      beforeJson,
      afterJson: {
        narrativeText: updated.narrativeText,
        structuredDataJson: updated.structuredDataJson,
      },
      editedByUserId: session.user.id,
    },
  });

  return NextResponse.json({ section: updated });
}
