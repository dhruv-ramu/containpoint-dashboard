import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ContainmentForm } from "../../containment-form";

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
  });
}

export default async function EditContainmentPage({
  params,
}: {
  params: Promise<{ facilityId: string; unitId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId, unitId } = await params;
  const unit = await getUnit(facilityId, unitId, session.user.id);
  if (!unit) notFound();

  const initial = {
    code: unit.code,
    name: unit.name,
    containmentType: unit.containmentType,
    largestSingleTankCapacityGallons: unit.largestSingleTankCapacityGallons ?? undefined,
    capacityCalculationMethod: unit.capacityCalculationMethod ?? undefined,
    calculatedCapacityGallons: unit.calculatedCapacityGallons ?? undefined,
    drainageControlNotes: unit.drainageControlNotes ?? undefined,
    conditionStatus: unit.conditionStatus ?? undefined,
    lastInspectionDate: unit.lastInspectionDate
      ? new Date(unit.lastInspectionDate).toISOString().slice(0, 10)
      : undefined,
    comments: unit.comments ?? undefined,
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Edit containment unit
        </h1>
        <p className="text-[var(--muted)] mt-1">
          {unit.code} — {unit.name}
        </p>
      </div>
      <ContainmentForm facilityId={facilityId} unitId={unitId} initial={initial} />
    </div>
  );
}
