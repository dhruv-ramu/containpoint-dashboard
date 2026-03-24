import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AssetForm } from "../asset-form";

async function getFacilityAndOilTypes(facilityId: string, userId: string) {
  const [facility, oilTypes, containmentUnits] = await Promise.all([
    prisma.facility.findFirst({
      where: {
        id: facilityId,
        OR: [
          { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
          { memberships: { some: { userId } } },
        ],
      },
    }),
    prisma.oilType.findMany({ where: { active: true }, orderBy: { label: "asc" } }),
    prisma.containmentUnit.findMany({
      where: { facilityId },
      orderBy: { code: "asc" },
    }),
  ]);
  return { facility, oilTypes, containmentUnits };
}

export default async function NewAssetPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const { facility, oilTypes, containmentUnits } = await getFacilityAndOilTypes(
    facilityId,
    session.user.id
  );
  if (!facility) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Add asset
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Register a new oil storage container or equipment
        </p>
      </div>
      <AssetForm
        facilityId={facilityId}
        oilTypes={oilTypes}
        containmentUnits={containmentUnits}
      />
    </div>
  );
}
