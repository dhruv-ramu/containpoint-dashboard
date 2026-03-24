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

export default async function AssetsPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const assets = await prisma.asset.findMany({
    where: { facilityId },
    include: { oilType: true },
    orderBy: { assetCode: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Asset registry
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Oil storage containers and equipment
          </p>
        </div>
        <Button asChild>
          <Link href={`/app/facilities/${facilityId}/assets/new`}>
            <Plus className="h-4 w-4" />
            Add asset
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
              <th className="text-left font-medium px-4 py-3">Oil type</th>
              <th className="text-left font-medium px-4 py-3">Capacity</th>
              <th className="text-left font-medium px-4 py-3">Aboveground</th>
              <th className="text-left font-medium px-4 py-3">Threshold</th>
              <th className="text-left font-medium px-4 py-3">Next inspection</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr
                key={a.id}
                className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/app/facilities/${facilityId}/assets/${a.id}`}
                    className="hover:underline"
                  >
                    {a.assetCode}
                  </Link>
                </td>
                <td className="px-4 py-3">{a.name}</td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {a.assetType.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3">{a.oilType?.label ?? "—"}</td>
                <td className="px-4 py-3">
                  {a.storageCapacityGallons != null
                    ? a.storageCapacityGallons.toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3">{a.aboveground ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{a.countedTowardThreshold ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  {a.nextInspectionDate
                    ? new Date(a.nextInspectionDate).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      a.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/app/facilities/${facilityId}/assets/${a.id}`}>
                      View
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assets.length === 0 && (
          <div className="py-16 text-center text-[var(--muted)]">
            <p>No assets yet</p>
            <Button asChild className="mt-4">
              <Link href={`/app/facilities/${facilityId}/assets/new`}>
                Add your first asset
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
