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
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
  const severity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(body.severity)
    ? body.severity
    : "MEDIUM";

  const incident = await prisma.incident.create({
    data: {
      facilityId,
      title,
      occurredAt,
      sourceAssetId: body.sourceAssetId || null,
      estimatedTotalSpilledGallons: body.estimatedTotalSpilledGallons ?? null,
      estimatedAmountToWaterGallons: body.estimatedAmountToWaterGallons ?? null,
      impactedWaterbody: body.impactedWaterbody?.trim() || null,
      cause: body.cause?.trim() || null,
      immediateActions: body.immediateActions?.trim() || null,
      notes: body.notes?.trim() || null,
      severity,
      createdByUserId: session.user.id,
    },
  });

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "Incident",
    objectId: incident.id,
    action: "incident.created",
    afterJson: { title, occurredAt, severity },
  });

  return NextResponse.json({ incident });
}
