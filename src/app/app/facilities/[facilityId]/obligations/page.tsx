import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

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

export default async function ObligationsPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const obligations = await prisma.obligationRecord.findMany({
    where: { facilityId },
    orderBy: { dueDate: "asc" },
  });

  const open = obligations.filter((o) => !o.satisfiedAt);
  const satisfied = obligations.filter((o) => o.satisfiedAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Obligations
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Requirement-linked compliance obligations
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <h2 className="font-medium mb-3">Open obligations ({open.length})</h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                  <th className="text-left font-medium px-4 py-3">Requirement</th>
                  <th className="text-left font-medium px-4 py-3">Type</th>
                  <th className="text-left font-medium px-4 py-3">Severity</th>
                  <th className="text-left font-medium px-4 py-3">Due date</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {open.map((o) => (
                  <tr key={o.id} className="border-b border-[var(--border)]">
                    <td className="px-4 py-3">{o.requirementCode ?? "—"}</td>
                    <td className="px-4 py-3">{o.obligationType.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{o.severity}</td>
                    <td className="px-4 py-3">
                      {o.dueDate ? new Date(o.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {open.length === 0 && (
              <div className="py-8 text-center text-[var(--muted)]">No open obligations</div>
            )}
          </div>
        </CardContent>
      </Card>

      {satisfied.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h2 className="font-medium mb-3">Satisfied ({satisfied.length})</h2>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                    <th className="text-left font-medium px-4 py-3">Requirement</th>
                    <th className="text-left font-medium px-4 py-3">Type</th>
                    <th className="text-left font-medium px-4 py-3">Satisfied at</th>
                  </tr>
                </thead>
                <tbody>
                  {satisfied.slice(0, 20).map((o) => (
                    <tr key={o.id} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3">{o.requirementCode ?? "—"}</td>
                      <td className="px-4 py-3">{o.obligationType.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        {o.satisfiedAt
                          ? new Date(o.satisfiedAt).toLocaleDateString()
                          : "—"}
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
  );
}
