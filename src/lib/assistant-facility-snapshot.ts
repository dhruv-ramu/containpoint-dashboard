import { prisma } from "@/lib/db";

export async function buildFacilitySnapshotJson(facilityId: string) {
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: {
      profile: true,
      applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
      qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
      plan: { include: { currentVersion: true } },
      assets: { where: { status: "ACTIVE" }, select: { id: true, assetCode: true, name: true, assetType: true } },
      containmentUnits: { select: { id: true, code: true, name: true } },
    },
  });

  if (!facility) return { error: "Facility not found" };

  const now = new Date();
  const scheduledInspections = await prisma.scheduledInspection.findMany({
    where: { facilityId, status: { in: ["SCHEDULED", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
    take: 15,
    select: {
      id: true,
      dueDate: true,
      status: true,
      template: { select: { name: true } },
      asset: { select: { name: true, assetCode: true } },
    },
  });

  const openCorrectiveActions = await prisma.correctiveAction.findMany({
    where: {
      facilityId,
      status: { in: ["OPEN", "IN_PROGRESS", "PENDING_VERIFICATION"] },
    },
    orderBy: { dueDate: "asc" },
    take: 15,
    select: {
      id: true,
      title: true,
      status: true,
      severity: true,
      dueDate: true,
      asset: { select: { name: true } },
    },
  });

  const trainingRecent = await prisma.trainingEvent.findMany({
    where: { facilityId },
    orderBy: { eventDate: "desc" },
    take: 5,
    select: {
      id: true,
      type: true,
      eventDate: true,
      instructorName: true,
      _count: { select: { attendance: true } },
    },
  });

  const incidentsRecent = await prisma.incident.findMany({
    where: { facilityId },
    orderBy: { occurredAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      occurredAt: true,
      severity: true,
    },
  });

  const app = facility.applicability[0];
  const qual = facility.qualification[0];
  const planVer = facility.plan?.currentVersion;

  return {
    facilityName: facility.name,
    status: facility.status,
    profile: facility.profile
      ? {
          legalName: facility.profile.legalName,
          city: facility.profile.city,
          state: facility.profile.state,
          nextFiveYearReviewDate: facility.profile.nextFiveYearReviewDate,
        }
      : null,
    applicability: app
      ? { spccApplicable: app.spccApplicable, assessedAt: app.assessedAt }
      : null,
    qualification: qual
      ? { tier: qual.tier, qualifiedFacility: qual.qualifiedFacility }
      : null,
    plan: planVer
      ? {
          versionNumber: planVer.versionNumber,
          effectiveDate: planVer.effectiveDate,
        }
      : null,
    counts: {
      activeAssets: facility.assets.length,
      containmentUnits: facility.containmentUnits.length,
    },
    scheduledInspections: scheduledInspections.map((s) => ({
      dueDate: s.dueDate,
      status: s.status,
      templateName: s.template?.name ?? null,
      assetLabel: s.asset ? `${s.asset.assetCode} ${s.asset.name}` : null,
    })),
    openCorrectiveActions: openCorrectiveActions.map((a) => ({
      title: a.title,
      status: a.status,
      severity: a.severity,
      dueDate: a.dueDate,
      assetName: a.asset?.name ?? null,
    })),
    trainingRecent: trainingRecent.map((t) => ({
      type: t.type,
      eventDate: t.eventDate,
      instructorName: t.instructorName,
      attendeeCount: t._count.attendance,
    })),
    incidentsRecent: incidentsRecent.map((i) => ({
      title: i.title,
      occurredAt: i.occurredAt,
      severity: i.severity,
    })),
    generatedAt: now.toISOString(),
  };
}
