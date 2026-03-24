import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Flame } from "lucide-react";

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

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-800 border-slate-200",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200",
    CRITICAL: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${variants[severity] ?? ""}`}
    >
      {severity.replace(/_/g, " ")}
    </span>
  );
}

export default async function IncidentsPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const incidents = await prisma.incident.findMany({
    where: { facilityId },
    include: { sourceAsset: { select: { name: true, assetCode: true } } },
    orderBy: { occurredAt: "desc" },
  });

  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Incident / discharge log
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Spills, discharges, and incident records for {facility.name}
          </p>
        </div>
        <Button asChild>
          <Link href={`/app/facilities/${facilityId}/incidents/new`}>
            <Plus className="h-4 w-4" />
            Log incident
          </Link>
        </Button>
      </div>

      {criticalCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-amber-900">
              {criticalCount} high-severity incident{criticalCount !== 1 ? "s" : ""} in
              history. Review in qualification and plan spill history.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                  <th className="text-left font-medium px-4 py-3">Date</th>
                  <th className="text-left font-medium px-4 py-3">Title</th>
                  <th className="text-left font-medium px-4 py-3">Source asset</th>
                  <th className="text-left font-medium px-4 py-3">Est. spilled (gal)</th>
                  <th className="text-left font-medium px-4 py-3">Severity</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {incidents.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50"
                  >
                    <td className="px-4 py-3">
                      {new Date(i.occurredAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{i.title}</td>
                    <td className="px-4 py-3">
                      {i.sourceAsset ? `${i.sourceAsset.assetCode} — ${i.sourceAsset.name}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {i.estimatedTotalSpilledGallons != null
                        ? i.estimatedTotalSpilledGallons.toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={i.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/facilities/${facilityId}/incidents/${i.id}`}>
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {incidents.length === 0 && (
              <div className="py-16 text-center text-[var(--muted)]">
                <Flame className="mx-auto h-12 w-12 opacity-40 mb-4" />
                <p>No incidents logged yet</p>
                <Button asChild className="mt-4">
                  <Link href={`/app/facilities/${facilityId}/incidents/new`}>
                    Log first incident
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
