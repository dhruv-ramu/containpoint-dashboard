import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function getUnit(facilityId: string, unitId: string, userId: string) {
  return prisma.containmentUnit.findFirst({
    where: {
      id: unitId,
      facilityId,
      facility: {
        OR: [
          { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
          { memberships: { some: { userId } } },
        ],
      },
    },
    include: {
      assetLinks: { include: { asset: true } },
    },
  });
}

export default async function ContainmentDetailPage({
  params,
}: {
  params: Promise<{ facilityId: string; unitId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId, unitId } = await params;
  const unit = await getUnit(facilityId, unitId, session.user.id);
  if (!unit) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {unit.code} — {unit.name}
          </h1>
          <p className="text-[var(--muted)] mt-1">
            {unit.containmentType.replace(/_/g, " ")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/facilities/${facilityId}/containment/${unitId}/edit`}>
            Edit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Calculated capacity</span>
            <span>
              {unit.calculatedCapacityGallons != null
                ? `${unit.calculatedCapacityGallons.toLocaleString()} gal`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Largest tank capacity</span>
            <span>
              {unit.largestSingleTankCapacityGallons != null
                ? `${unit.largestSingleTankCapacityGallons.toLocaleString()} gal`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Condition</span>
            <span>{unit.conditionStatus ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Last inspection</span>
            <span>
              {unit.lastInspectionDate
                ? new Date(unit.lastInspectionDate).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {unit.capacityCalculationMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Capacity basis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{unit.capacityCalculationMethod}</p>
          </CardContent>
        </Card>
      )}

      {unit.assetLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked assets</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {unit.assetLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={`/app/facilities/${facilityId}/assets/${link.asset.id}`}
                    className="text-[var(--steel-blue)] hover:underline"
                  >
                    {link.asset.assetCode} — {link.asset.name}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href={`/app/facilities/${facilityId}/containment`}>Back to list</Link>
        </Button>
      </div>
    </div>
  );
}
