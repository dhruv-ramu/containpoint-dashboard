import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeValidation } from "@/lib/validation";
import { FacilityDashboard } from "./facility-dashboard";

async function getFacility(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
    include: {
      profile: true,
      accountablePerson: true,
      applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
      qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
      plan: { include: { currentVersion: true } },
      _count: { select: { assets: true, containmentUnits: true, files: true } },
    },
  });
}

export default async function FacilityPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const [
    validation,
    overdueInspections,
    overdueActions,
    upcomingInspections,
    trainingSummary,
    openCorrectiveActionCount,
    recentActivity,
  ] = await Promise.all([
      computeValidation(facilityId),
      prisma.scheduledInspection.findMany({
        where: {
          facilityId,
          status: { notIn: ["completed", "canceled"] },
          dueDate: { lt: new Date() },
        },
        include: { template: true, asset: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.correctiveAction.findMany({
        where: {
          facilityId,
          status: { notIn: ["CLOSED", "ACCEPTED_RISK"] },
          dueDate: { lt: new Date() },
        },
        include: { asset: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.scheduledInspection.findMany({
        where: {
          facilityId,
          status: { notIn: ["completed", "canceled"] },
          dueDate: { gte: new Date() },
        },
        include: { template: true, asset: true },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.trainingEvent.findMany({
        where: { facilityId, type: "ANNUAL_BRIEFING" },
        orderBy: { eventDate: "desc" },
        take: 1,
      }).then((events) => {
        const latest = events[0];
        const hasRecentBriefing =
          latest &&
          new Date(latest.eventDate) >
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        return { hasRecentBriefing: !!hasRecentBriefing, latestDate: latest?.eventDate };
      }),
      prisma.correctiveAction.count({
        where: {
          facilityId,
          status: { notIn: ["CLOSED", "ACCEPTED_RISK"] },
        },
      }),
      prisma.auditEvent.findMany({
        where: { facilityId },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { actor: { select: { name: true, email: true } } },
      }),
    ]);

  return (
    <FacilityDashboard
      facility={facility}
      validation={validation}
      overdueInspections={overdueInspections}
      overdueActions={overdueActions}
      upcomingInspections={upcomingInspections}
      trainingSummary={trainingSummary}
      openCorrectiveActionCount={openCorrectiveActionCount}
      recentActivity={recentActivity}
    />
  );
}
