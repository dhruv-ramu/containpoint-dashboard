import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import type { AmendmentType } from "@/generated/prisma/enums";

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

const VALID_AMENDMENT_TYPES = [
  "FIVE_YEAR_REVIEW",
  "ASSET_CHANGE",
  "OWNERSHIP_CHANGE",
  "INCIDENT",
  "PROCEDURAL_CHANGE",
  "CONSULTANT_RECOMMENDATION",
];
const VALID_STATUSES = ["OPEN", "DRAFTING", "READY_FOR_APPROVAL", "IMPLEMENTED", "CLOSED"];
const VALID_TECHNICAL = ["TECHNICAL", "NON_TECHNICAL"];

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
  const amendmentType = body.amendmentType as string;
  if (!VALID_AMENDMENT_TYPES.includes(amendmentType)) {
    return NextResponse.json({ error: "Invalid amendment type" }, { status: 400 });
  }

  const description = String(body.description ?? "").trim();
  if (!description) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  const amendment = await prisma.planAmendment.create({
    data: {
      facilityId,
      planVersionId: body.planVersionId || null,
      amendmentType: amendmentType as AmendmentType,
      technicalChangeType: VALID_TECHNICAL.includes(body.technicalChangeType)
        ? body.technicalChangeType
        : null,
      description,
      dueBy: body.dueBy ? new Date(body.dueBy) : null,
      status: "OPEN",
      requiresPe: Boolean(body.requiresPe),
      createdByUserId: session.user.id,
    },
  });

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "PlanAmendment",
    objectId: amendment.id,
    action: "plan_amendment.created",
    afterJson: { amendmentType, status: "OPEN" },
  });

  return NextResponse.json({ amendment });
}
