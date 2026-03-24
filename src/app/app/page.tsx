import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, AlertTriangle } from "lucide-react";

export default async function AppDashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const orgMembership = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (!orgMembership) return null;

  const isOrgAdmin = orgMembership.role === "ORG_ADMIN";
  const facilities = isOrgAdmin
    ? await prisma.facility.findMany({
        where: { organizationId: orgMembership.organizationId },
        include: {
          _count: { select: { assets: true, containmentUnits: true } },
          qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
          applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
          profile: true,
          accountablePerson: true,
        },
        orderBy: { name: "asc" },
      })
    : (
        await prisma.facilityMembership.findMany({
          where: { userId: session.user.id },
          include: {
            facility: {
              include: {
                _count: { select: { assets: true, containmentUnits: true } },
                qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
                applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
                profile: true,
                accountablePerson: true,
              },
            },
          },
        })
      ).map((m) => m.facility);

  const facilityIds = facilities.map((f) => f.id);

  type ScheduledInspWithRelations = { id: string; facilityId: string; dueDate: Date; facility?: { name?: string } | null; template?: { name?: string } | null; asset?: { name?: string } | null };
  type CorrectiveActionWithRelations = { id: string; facilityId: string; dueDate?: Date | null; facility?: { name?: string } | null; title: string };
  const prismaAny = prisma as {
    scheduledInspection?: { findMany: (args: unknown) => Promise<ScheduledInspWithRelations[]> };
    correctiveAction?: { findMany: (args: unknown) => Promise<CorrectiveActionWithRelations[]> };
  };
  const [overdueInspections, overdueActions] =
    facilityIds.length > 0
      ? await Promise.all([
          prismaAny.scheduledInspection?.findMany({
            where: {
              facilityId: { in: facilityIds },
              status: { notIn: ["completed", "canceled"] },
              dueDate: { lt: new Date() },
            },
            include: {
              template: true,
              asset: true,
              facility: { select: { id: true, name: true } },
            },
            orderBy: { dueDate: "asc" },
            take: 20,
          }) ?? [],
          prismaAny.correctiveAction?.findMany({
            where: {
              facilityId: { in: facilityIds },
              status: { notIn: ["CLOSED", "ACCEPTED_RISK"] },
              dueDate: { lt: new Date() },
            },
            include: {
              asset: true,
              facility: { select: { id: true, name: true } },
            },
            orderBy: { dueDate: "asc" },
            take: 20,
          }) ?? [],
        ])
      : [[], []];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Overview of your facilities and compliance status
          </p>
        </div>
        <Button asChild>
          <Link href="/app/facilities/new">
            <Plus className="h-4 w-4" />
            New facility
          </Link>
        </Button>
      </div>

      {/* Consultant view: cross-facility overdue */}
      {(overdueInspections.length > 0 || overdueActions.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {overdueInspections.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Cross-facility overdue inspections
                </CardTitle>
                <CardDescription>
                  Inspections past due across all facilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                        <th className="text-left font-medium px-4 py-3">Facility</th>
                        <th className="text-left font-medium px-4 py-3">Template</th>
                        <th className="text-left font-medium px-4 py-3">Asset</th>
                        <th className="text-left font-medium px-4 py-3">Due</th>
                        <th className="w-16" />
                      </tr>
                    </thead>
                    <tbody>
                      {overdueInspections.map((s) => (
                        <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50">
                          <td className="px-4 py-3">{s.facility?.name ?? "—"}</td>
                          <td className="px-4 py-3">{s.template?.name ?? "—"}</td>
                          <td className="px-4 py-3">{s.asset?.name ?? "—"}</td>
                          <td className="px-4 py-3 text-amber-700">
                            {new Date(s.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/app/facilities/${s.facilityId}/inspections/schedule/${s.id}/run`}>
                                Run
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
          {overdueActions.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Cross-facility overdue corrective actions
                </CardTitle>
                <CardDescription>
                  Open corrective actions past due across all facilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                        <th className="text-left font-medium px-4 py-3">Facility</th>
                        <th className="text-left font-medium px-4 py-3">Title</th>
                        <th className="text-left font-medium px-4 py-3">Due</th>
                        <th className="w-16" />
                      </tr>
                    </thead>
                    <tbody>
                      {overdueActions.map((a) => (
                        <tr key={a.id} className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50">
                          <td className="px-4 py-3">{a.facility?.name ?? "—"}</td>
                          <td className="px-4 py-3">{a.title}</td>
                          <td className="px-4 py-3 text-amber-700">
                            {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/app/facilities/${a.facilityId}/corrective-actions/${a.id}`}>
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {facilities.map((facility) => {
          const q = facility.qualification[0];
          const a = facility.applicability[0];
          const tier = q?.tier ?? "—";
          const applicable = a?.spccApplicable ? "Yes" : a ? "No" : "—";
          return (
            <Link key={facility.id} href={`/app/facilities/${facility.id}`}>
              <Card className="hover:border-[var(--steel-blue)] transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Building2 className="h-8 w-8 text-[var(--muted)]" />
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        facility.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : facility.status === "DRAFT"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {facility.status}
                    </span>
                  </div>
                  <CardTitle className="font-serif text-lg mt-2">
                    {facility.name}
                  </CardTitle>
                  <CardDescription>
                    {facility.profile?.city && facility.profile?.state
                      ? `${facility.profile.city}, ${facility.profile.state}`
                      : "Address not set"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">SPCC applicable</span>
                    <span>{applicable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Qualification tier</span>
                    <span>{String(tier).replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Assets</span>
                    <span>{facility._count.assets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Containment units</span>
                    <span>{facility._count.containmentUnits}</span>
                  </div>
                  {facility.profile?.nextFiveYearReviewDate && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Next 5-yr review</span>
                      <span>
                        {new Date(
                          facility.profile.nextFiveYearReviewDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {facilities.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-[var(--muted)] mb-4" />
            <p className="font-serif text-lg font-medium">No facilities yet</p>
            <p className="text-[var(--muted)] text-sm mt-1 mb-4">
              Create your first facility to get started with SPCC compliance
            </p>
            <Button asChild>
              <Link href="/app/facilities/new">
                <Plus className="h-4 w-4" />
                Create facility
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
