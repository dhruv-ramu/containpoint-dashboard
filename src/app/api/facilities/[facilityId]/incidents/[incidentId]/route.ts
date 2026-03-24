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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ facilityId: string; incidentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, incidentId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, facilityId },
    include: { sourceAsset: true, files: true },
  });

  if (!incident) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ incident });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ facilityId: string; incidentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, incidentId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.incident.findFirst({
    where: { id: incidentId, facilityId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const title = String(body.title ?? existing.title).trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const severity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(body.severity)
    ? body.severity
    : existing.severity;

  const incident = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      title,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : existing.occurredAt,
      sourceAssetId: body.sourceAssetId ?? existing.sourceAssetId,
      estimatedTotalSpilledGallons: body.estimatedTotalSpilledGallons ?? existing.estimatedTotalSpilledGallons,
      estimatedAmountToWaterGallons: body.estimatedAmountToWaterGallons ?? existing.estimatedAmountToWaterGallons,
      impactedWaterbody: body.impactedWaterbody?.trim() ?? existing.impactedWaterbody,
      cause: body.cause?.trim() ?? existing.cause,
      immediateActions: body.immediateActions?.trim() ?? existing.immediateActions,
      notes: body.notes?.trim() ?? existing.notes,
      severity,
    },
  });

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "Incident",
    objectId: incident.id,
    action: "incident.updated",
    afterJson: { title, severity },
  });

  return NextResponse.json({ incident });
}
