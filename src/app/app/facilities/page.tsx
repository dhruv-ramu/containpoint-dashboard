import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";

export default async function FacilitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const orgMembership = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id },
  });
  if (!orgMembership) return null;

  const isOrgAdmin = orgMembership.role === "ORG_ADMIN";
  const facilities = isOrgAdmin
    ? await prisma.facility.findMany({
        where: { organizationId: orgMembership.organizationId },
        include: {
          _count: { select: { assets: true, containmentUnits: true } },
          qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
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
              },
            },
          },
        })
      ).map((m) => m.facility);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Facilities
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Manage your regulated facilities
          </p>
        </div>
        <Button asChild>
          <Link href="/app/facilities/new">
            <Plus className="h-4 w-4" />
            New facility
          </Link>
        </Button>
      </div>

      <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
              <th className="text-left font-medium px-4 py-3">Facility</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Tier</th>
              <th className="text-left font-medium px-4 py-3">Assets</th>
              <th className="text-left font-medium px-4 py-3">Containment</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {facilities.map((f) => (
              <tr
                key={f.id}
                className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/app/facilities/${f.id}`}
                    className="font-medium hover:underline"
                  >
                    {f.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      f.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : f.status === "DRAFT"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {f.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {f.qualification[0]?.tier?.replace(/_/g, " ") ?? "—"}
                </td>
                <td className="px-4 py-3">{f._count.assets}</td>
                <td className="px-4 py-3">{f._count.containmentUnits}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/app/facilities/${f.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {facilities.length === 0 && (
          <div className="py-16 text-center text-[var(--muted)]">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No facilities yet</p>
            <Button asChild className="mt-4">
              <Link href="/app/facilities/new">Create your first facility</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
