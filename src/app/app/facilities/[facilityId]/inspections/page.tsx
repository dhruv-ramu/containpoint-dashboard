import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

export default async function InspectionsPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const templates = await prisma.inspectionTemplate.findMany({
    where: {
      organizationId: facility.organizationId,
      OR: [{ facilityId: null }, { facilityId }],
      active: true,
    },
    include: {
      versions: {
        where: { active: true },
        orderBy: { version: "desc" },
        take: 1,
        include: { items: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const scheduledInspections = await prisma.scheduledInspection.findMany({
    where: { facilityId },
    include: { template: true, asset: true },
    orderBy: { dueDate: "asc" },
  });

  const overdue = scheduledInspections.filter(
    (s) => s.status !== "completed" && s.status !== "canceled" && new Date(s.dueDate) < new Date()
  );
  const upcoming = scheduledInspections.filter(
    (s) => s.status !== "completed" && s.status !== "canceled" && new Date(s.dueDate) >= new Date()
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Inspections
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Templates, schedules, and execution
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/app/facilities/${facilityId}/inspections/schedule/new`}>
              Schedule inspection
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/app/facilities/${facilityId}/inspections/templates/new`}>
              <Plus className="h-4 w-4" />
              New template
            </Link>
          </Button>
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h2 className="font-medium text-amber-800 mb-3">Overdue inspections</h2>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                    <th className="text-left font-medium px-4 py-3">Template</th>
                    <th className="text-left font-medium px-4 py-3">Asset</th>
                    <th className="text-left font-medium px-4 py-3">Due date</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50">
                      <td className="px-4 py-3">{s.template.name}</td>
                      <td className="px-4 py-3">{s.asset?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-amber-700">
                        {new Date(s.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{s.status.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/app/facilities/${facilityId}/inspections/schedule/${s.id}/run`}>
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

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h2 className="font-medium mb-3">Upcoming inspections</h2>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                    <th className="text-left font-medium px-4 py-3">Template</th>
                    <th className="text-left font-medium px-4 py-3">Asset</th>
                    <th className="text-left font-medium px-4 py-3">Due date</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {upcoming.slice(0, 10).map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50">
                      <td className="px-4 py-3">{s.template.name}</td>
                      <td className="px-4 py-3">{s.asset?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        {new Date(s.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{s.status.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/app/facilities/${facilityId}/inspections/schedule/${s.id}/run`}>
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

      {/* Templates */}
      <Card>
        <CardContent className="pt-5">
          <h2 className="font-medium mb-3">Inspection templates</h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3">Asset class</th>
                  <th className="text-left font-medium px-4 py-3">Type</th>
                  <th className="text-left font-medium px-4 py-3">Items</th>
                  <th className="text-left font-medium px-4 py-3">Scope</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const version = t.versions[0];
                  const itemCount = version?.items?.length ?? 0;
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/app/facilities/${facilityId}/inspections/templates/${t.id}`}
                          className="hover:underline"
                        >
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {t.assetClass.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {t.inspectionType.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">{itemCount}</td>
                      <td className="px-4 py-3">
                        {t.facilityId ? "Facility" : "Org-wide"}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/app/facilities/${facilityId}/inspections/templates/${t.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {templates.length === 0 && (
              <div className="py-12 text-center text-[var(--muted)]">
                <p>No inspection templates yet</p>
                <Button asChild className="mt-4">
                  <Link href={`/app/facilities/${facilityId}/inspections/templates/new`}>
                    Create first template
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
