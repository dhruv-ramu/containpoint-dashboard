import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    include: {
      applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
      qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
    },
  });
}

export default async function ApplicabilityPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const a = facility.applicability[0];
  const q = facility.qualification[0];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Applicability & qualification
          </h1>
          <p className="text-[var(--muted)] mt-1">
            SPCC applicability and facility tier for {facility.name}
          </p>
        </div>
        <Button asChild>
          <Link href={`/app/facilities/${facilityId}/setup`}>
            Update assessment
          </Link>
        </Button>
      </div>

      {!a ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--muted)]">No applicability assessment yet</p>
            <Button asChild className="mt-4">
              <Link href={`/app/facilities/${facilityId}/setup`}>
                Run setup wizard
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Applicability result</CardTitle>
              <p className="text-sm text-[var(--muted)]">
                Assessed {new Date(a.assessedAt).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">SPCC applicable</span>
                <span
                  className={
                    a.spccApplicable ? "text-green-600 font-medium" : "text-[var(--muted)]"
                  }
                >
                  {a.spccApplicable ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Non-transportation-related</span>
                <span>{a.nonTransportationRelated ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Aggregate aboveground (gal)</span>
                <span>{a.aggregateAbovegroundCapacityGallons.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Buried capacity (gal)</span>
                <span>{a.completelyBuriedCapacityGallons.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {q && (
            <Card>
              <CardHeader>
                <CardTitle>Qualification result</CardTitle>
                <p className="text-sm text-[var(--muted)]">
                  Assessed {new Date(q.assessedAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Tier</span>
                  <span className="font-medium">{q.tier.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Qualified facility</span>
                  <span>{q.qualifiedFacility ? "Yes" : "No"}</span>
                </div>
                {q.qualificationRationale && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-[var(--muted)]">{q.qualificationRationale}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
