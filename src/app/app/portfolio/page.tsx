import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";

async function getPortfolioData(userId: string) {
  const orgMembership = await prisma.organizationMembership.findFirst({
    where: { userId },
    include: { organization: true },
  });
  if (!orgMembership) return null;

  const isOrgAdmin = orgMembership.role === "ORG_ADMIN";
  const facilities = isOrgAdmin
    ? await prisma.facility.findMany({
        where: { organizationId: orgMembership.organizationId },
        include: {
          profile: true,
          qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
          plan: { include: { currentVersion: true } },
          _count: {
            select: {
              assets: true,
              correctiveActions: true,
            },
          },
        },
        orderBy: { name: "asc" },
      })
    : (
        await prisma.facilityMembership.findMany({
          where: { userId },
          include: {
            facility: {
              include: {
                profile: true,
                qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
                plan: { include: { currentVersion: true } },
                _count: {
                  select: {
                    assets: true,
                    correctiveActions: true,
                  },
                },
              },
            },
          },
        })
      ).map((m) => m.facility);

  const facilityIds = facilities.map((f) => f.id);

  const [overdueInspections, overdueActions] =
    facilityIds.length > 0
      ? await Promise.all([
          prisma.scheduledInspection.findMany({
            where: {
              facilityId: { in: facilityIds },
              status: { notIn: ["completed", "canceled"] },
              dueDate: { lt: new Date() },
            },
            include: {
              facility: { select: { id: true, name: true } },
              template: true,
              asset: true,
            },
            orderBy: { dueDate: "asc" },
            take: 20,
          }),
          prisma.correctiveAction.findMany({
            where: {
              facilityId: { in: facilityIds },
              status: { notIn: ["CLOSED", "ACCEPTED_RISK"] },
              dueDate: { lt: new Date() },
            },
            include: {
              facility: { select: { id: true, name: true } },
            },
            orderBy: { dueDate: "asc" },
            take: 20,
          }),
        ])
      : [[], []];

  const trainingBriefing = facilityIds.length
    ? await prisma.trainingEvent.findMany({
        where: {
          facilityId: { in: facilityIds },
          type: "ANNUAL_BRIEFING",
        },
        orderBy: { eventDate: "desc" },
        distinct: ["facilityId"],
        take: facilityIds.length,
      })
    : [];

  const briefingByFacility = new Map(
    trainingBriefing.map((t) => [
      t.facilityId,
      t.eventDate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    ])
  );

  return {
    facilities,
    overdueInspections,
    overdueActions,
    briefingByFacility,
  };
}

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getPortfolioData(session.user.id);
  if (!data) redirect("/app");

  const { facilities, overdueInspections, overdueActions, briefingByFacility } =
    data;

  if (facilities.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Portfolio
        </h1>
        <Card>
          <CardContent className="py-12 text-center">
            <LayoutGrid className="mx-auto h-12 w-12 text-[var(--muted)] mb-4" />
            <p className="text-[var(--muted)]">No facilities in your portfolio</p>
            <Button asChild className="mt-4">
              <Link href="/app/facilities">View facilities</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Portfolio
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Multi-facility compliance overview
        </p>
      </div>

      {(overdueInspections.length > 0 || overdueActions.length > 0) && (
        <Card className="border-amber-200">
          <CardHeader>
            <h2 className="font-medium flex items-center gap-2">
              Cross-facility overdue items
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueInspections.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Inspections overdue ({overdueInspections.length})
                </h3>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--mist-gray)]">
                        <th className="text-left px-4 py-2">Facility</th>
                        <th className="text-left px-4 py-2">Template</th>
                        <th className="text-left px-4 py-2">Due</th>
                        <th className="w-20" />
                      </tr>
                    </thead>
                    <tbody>
                      {overdueInspections.slice(0, 10).map((s) => (
                        <tr
                          key={s.id}
                          className="border-t border-[var(--border)] hover:bg-[var(--mist-gray)]/50"
                        >
                          <td className="px-4 py-2">{s.facility?.name ?? "—"}</td>
                          <td className="px-4 py-2">{s.template?.name ?? "—"}</td>
                          <td className="px-4 py-2 text-amber-700">
                            {new Date(s.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                href={`/app/facilities/${s.facilityId}/inspections/schedule/${s.id}/run`}
                              >
                                Run
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {overdueActions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Corrective actions overdue ({overdueActions.length})
                </h3>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--mist-gray)]">
                        <th className="text-left px-4 py-2">Facility</th>
                        <th className="text-left px-4 py-2">Title</th>
                        <th className="text-left px-4 py-2">Due</th>
                        <th className="w-20" />
                      </tr>
                    </thead>
                    <tbody>
                      {overdueActions.slice(0, 10).map((a) => (
                        <tr
                          key={a.id}
                          className="border-t border-[var(--border)] hover:bg-[var(--mist-gray)]/50"
                        >
                          <td className="px-4 py-2">{a.facility?.name ?? "—"}</td>
                          <td className="px-4 py-2">{a.title}</td>
                          <td className="px-4 py-2 text-amber-700">
                            {a.dueDate
                              ? new Date(a.dueDate).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                href={`/app/facilities/${a.facilityId}/corrective-actions/${a.id}`}
                              >
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-medium">Facilities</h2>
        </CardHeader>
        <CardContent>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                  <th className="text-left font-medium px-4 py-3">Facility</th>
                  <th className="text-left font-medium px-4 py-3">Qualification</th>
                  <th className="text-left font-medium px-4 py-3">Plan status</th>
                  <th className="text-left font-medium px-4 py-3">5-year review</th>
                  <th className="text-left font-medium px-4 py-3">Annual briefing</th>
                  <th className="text-left font-medium px-4 py-3">Assets</th>
                  <th className="text-left font-medium px-4 py-3">Open actions</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {facilities.map((f) => {
                  const qual = f.qualification[0];
                  const planVersion = f.plan?.currentVersion;
                  const nextReview = f.profile?.nextFiveYearReviewDate;
                  const hasBriefing = briefingByFacility.get(f.id);
                  const facilityOverdueInsp = overdueInspections.filter(
                    (s) => s.facilityId === f.id
                  ).length;
                  const facilityOverdueActions = overdueActions.filter(
                    (a) => a.facilityId === f.id
                  ).length;

                  return (
                    <tr
                      key={f.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/app/facilities/${f.id}`}
                          className="hover:underline"
                        >
                          {f.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {qual?.tier?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {planVersion
                          ? `${planVersion.status} (v${planVersion.versionNumber})`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {nextReview
                          ? new Date(nextReview).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {hasBriefing ? (
                          <span className="text-emerald-700">Yes</span>
                        ) : (
                          <span className="text-amber-700">Due</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{f._count.assets}</td>
                      <td className="px-4 py-3">
                        {f._count.correctiveActions}
                        {facilityOverdueActions > 0 && (
                          <span className="ml-1 text-amber-700">
                            ({facilityOverdueActions} overdue)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/app/facilities/${f.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
