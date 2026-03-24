import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default async function CorrectiveActionsPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const actions = await prisma.correctiveAction.findMany({
    where: { facilityId },
    include: { asset: true, owner: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const overdue = actions.filter(
    (a) =>
      !["CLOSED", "ACCEPTED_RISK"].includes(a.status) &&
      a.dueDate &&
      new Date(a.dueDate) < new Date()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Corrective actions
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Open items from inspections and compliance checks
        </p>
      </div>

      {overdue.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h2 className="font-medium text-amber-800 mb-3">Overdue ({overdue.length})</h2>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                    <th className="text-left font-medium px-4 py-3">Title</th>
                    <th className="text-left font-medium px-4 py-3">Asset</th>
                    <th className="text-left font-medium px-4 py-3">Severity</th>
                    <th className="text-left font-medium px-4 py-3">Due</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((a) => (
                    <tr key={a.id} className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50">
                      <td className="px-4 py-3">{a.title}</td>
                      <td className="px-4 py-3">{a.asset?.name ?? "—"}</td>
                      <td className="px-4 py-3">{a.severity}</td>
                      <td className="px-4 py-3 text-amber-700">
                        {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">{a.status.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/app/facilities/${facilityId}/corrective-actions/${a.id}`}>
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

      <Card>
        <CardContent className="pt-5">
          <h2 className="font-medium mb-3">All corrective actions</h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                  <th className="text-left font-medium px-4 py-3">Title</th>
                  <th className="text-left font-medium px-4 py-3">Asset</th>
                  <th className="text-left font-medium px-4 py-3">Severity</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Owner</th>
                  <th className="text-left font-medium px-4 py-3">Due</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50">
                    <td className="px-4 py-3">{a.title}</td>
                    <td className="px-4 py-3">{a.asset?.name ?? "—"}</td>
                    <td className="px-4 py-3">{a.severity}</td>
                    <td className="px-4 py-3">{a.status.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{a.owner?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/facilities/${facilityId}/corrective-actions/${a.id}`}>
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {actions.length === 0 && (
              <div className="py-12 text-center text-[var(--muted)]">
                <p>No corrective actions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
