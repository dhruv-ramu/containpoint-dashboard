import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";

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
