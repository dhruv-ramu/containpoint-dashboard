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
    select: { id: true, organizationId: true },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ facilityId: string; reviewId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, reviewId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const review = await prisma.planReview.findFirst({
    where: { id: reviewId, facilityId },
  });
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  if (body.complete) {
    await prisma.planReview.update({
      where: { id: reviewId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedByUserId: session.user.id,
        summary: body.summary ?? review.summary,
        requiresAmendment: body.requiresAmendment ?? review.requiresAmendment,
        notes: body.notes ?? review.notes,
      },
    });

    await recordAuditEvent({
      organizationId: facility.organizationId,
      facilityId,
      actorUserId: session.user.id,
      objectType: "PlanReview",
      objectId: reviewId,
      action: "plan_review.completed",
      afterJson: { status: "COMPLETED" },
    });

    if (body.requiresAmendment && body.createAmendment) {
      await prisma.planAmendment.create({
        data: {
          facilityId,
          planVersionId: review.planVersionId,
          amendmentType: "FIVE_YEAR_REVIEW",
          description: body.amendmentDescription ?? `Amendment required from 5-year review completed ${new Date().toLocaleDateString()}`,
          status: "OPEN",
          createdByUserId: session.user.id,
        },
      });
    }
  }

  const updated = await prisma.planReview.findUnique({
    where: { id: reviewId },
  });
  return NextResponse.json({ review: updated });
}
