import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

export default async function ContainmentPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const units = await prisma.containmentUnit.findMany({
    where: { facilityId },
    include: { _count: { select: { assetLinks: true } } },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Containment registry
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Secondary containment structures
          </p>
        </div>
        <Button asChild>
          <Link href={`/app/facilities/${facilityId}/containment/new`}>
            <Plus className="h-4 w-4" />
            Add containment unit
          </Link>
        </Button>
      </div>

      <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
              <th className="text-left font-medium px-4 py-3">Code</th>
              <th className="text-left font-medium px-4 py-3">Name</th>
              <th className="text-left font-medium px-4 py-3">Type</th>
              <th className="text-left font-medium px-4 py-3">Linked assets</th>
              <th className="text-left font-medium px-4 py-3">Capacity (gal)</th>
              <th className="text-left font-medium px-4 py-3">Last inspection</th>
              <th className="text-left font-medium px-4 py-3">Condition</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr
                key={u.id}
                className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/app/facilities/${facilityId}/containment/${u.id}`}
                    className="hover:underline"
                  >
                    {u.code}
                  </Link>
                </td>
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {u.containmentType.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3">{u._count.assetLinks}</td>
                <td className="px-4 py-3">
                  {u.calculatedCapacityGallons != null
                    ? u.calculatedCapacityGallons.toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {u.lastInspectionDate
                    ? new Date(u.lastInspectionDate).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">{u.conditionStatus ?? "—"}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/app/facilities/${facilityId}/containment/${u.id}`}>
                      View
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {units.length === 0 && (
          <div className="py-16 text-center text-[var(--muted)]">
            <p>No containment units yet</p>
            <Button asChild className="mt-4">
              <Link href={`/app/facilities/${facilityId}/containment/new`}>
                Add your first containment unit
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
