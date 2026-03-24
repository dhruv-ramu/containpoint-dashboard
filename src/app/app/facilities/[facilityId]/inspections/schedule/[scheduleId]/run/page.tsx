import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InspectionRunForm } from "./inspection-run-form";

async function getFacility(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
  });
}

export default async function InspectionRunPage({
  params,
}: {
  params: Promise<{ facilityId: string; scheduleId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId, scheduleId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const scheduled = await prisma.scheduledInspection.findFirst({
    where: { id: scheduleId, facilityId },
    include: {
      template: true,
      asset: true,
      runs: { orderBy: { performedAt: "desc" }, take: 1 },
    },
  });

  if (!scheduled) notFound();

  const template = await prisma.inspectionTemplate.findFirst({
    where: { id: scheduled.templateId },
    include: {
      versions: {
        where: { active: true },
        orderBy: { version: "desc" },
        take: 1,
        include: { items: { orderBy: { sequenceOrder: "asc" } } },
      },
    },
  });

  if (!template) notFound();

  const version = template.versions[0];
  const items = version?.items ?? [];
  const latestRun = scheduled.runs[0];
  const isLocked = latestRun?.locked ?? false;

  const membership = await prisma.facilityMembership.findUnique({
    where: { facilityId_userId: { facilityId, userId: session.user.id } },
  });
  const userRole = membership?.role ?? "INSPECTOR";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Execute: {scheduled.template.name}
        </h1>
        <p className="text-[var(--muted)] mt-1">
          {scheduled.asset?.name ?? "Facility-level"} · Due{" "}
          {new Date(scheduled.dueDate).toLocaleDateString()}
        </p>
      </div>

      {isLocked ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-medium">Inspection locked</p>
          <p className="text-sm mt-1">
            This inspection was completed and signed on{" "}
            {latestRun ? new Date(latestRun.performedAt).toLocaleString() : ""}. Locked records
            cannot be edited.
          </p>
        </div>
      ) : (
        <InspectionRunForm
          facilityId={facilityId}
          scheduleId={scheduleId}
          items={items}
          template={template}
          asset={scheduled.asset}
          performer={{
            userId: session.user.id,
            name: session.user.name ?? "Unknown",
            role: userRole,
            qualificationBasis: template.performerQualificationBasis ?? undefined,
          }}
        />
      )}
    </div>
  );
}
