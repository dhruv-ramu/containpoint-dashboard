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

function getReviewStatus(dueDate: Date): "UPCOMING" | "DUE" | "OVERDUE" {
  const now = new Date();
  const due = new Date(dueDate);
  if (due > now) return "UPCOMING";
  const daysPast = Math.floor((now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
  return daysPast > 30 ? "OVERDUE" : "DUE";
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
  const dueDate = body.dueDate ? new Date(body.dueDate) : new Date();
  const planVersionId = body.planVersionId as string | undefined;

  const plan = await prisma.plan.findUnique({
    where: { facilityId },
    include: { currentVersion: true, versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  if (!plan) {
    return NextResponse.json({ error: "No plan found" }, { status: 400 });
  }

  const versionId = planVersionId ?? plan.currentVersionId ?? plan.versions[0]?.id;
  if (!versionId) {
    return NextResponse.json({ error: "No plan version to review" }, { status: 400 });
  }

  const version = await prisma.planVersion.findFirst({
    where: { id: versionId, facilityId },
  });
  if (!version) {
    return NextResponse.json({ error: "Plan version not found" }, { status: 404 });
  }

  const status = getReviewStatus(dueDate);

  const review = await prisma.planReview.create({
    data: {
      facilityId,
      planVersionId: versionId,
      dueDate,
      status,
    },
  });

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "PlanReview",
    objectId: review.id,
    action: "plan_review.completed",
    afterJson: { dueDate, status },
  });

  return NextResponse.json({ review });
}
