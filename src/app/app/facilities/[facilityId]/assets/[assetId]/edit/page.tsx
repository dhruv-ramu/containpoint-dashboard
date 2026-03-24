import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AssetForm } from "../../asset-form";

async function getData(facilityId: string, assetId: string, userId: string) {
  const [asset, facility, oilTypes, containmentUnits] = await Promise.all([
    prisma.asset.findFirst({
      where: {
        id: assetId,
        facilityId,
        facility: {
          OR: [
            { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
            { memberships: { some: { userId } } },
          ],
        },
      },
      include: {
        oilType: true,
        containmentLinks: true,
      },
    }),
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
  return { asset, facility, oilTypes, containmentUnits };
}

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ facilityId: string; assetId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId, assetId } = await params;
  const { asset, facility, oilTypes, containmentUnits } = await getData(
    facilityId,
    assetId,
    session.user.id
  );
  if (!asset || !facility) notFound();

  const initial = {
    assetCode: asset.assetCode,
    name: asset.name,
    assetType: asset.assetType,
    oilTypeId: asset.oilTypeId ?? undefined,
    storageCapacityGallons: asset.storageCapacityGallons ?? undefined,
    typicalFillPercent: asset.typicalFillPercent ?? undefined,
    countedTowardThreshold: asset.countedTowardThreshold,
    exclusionReason: asset.exclusionReason ?? undefined,
    aboveground: asset.aboveground,
    indoor: asset.indoor ?? undefined,
    status: asset.status,
    installDate: asset.installDate
      ? new Date(asset.installDate).toISOString().slice(0, 10)
      : undefined,
    retirementDate: asset.retirementDate
      ? new Date(asset.retirementDate).toISOString().slice(0, 10)
      : undefined,
    manufacturer: asset.manufacturer ?? undefined,
    material: asset.material ?? undefined,
    dimensions: asset.dimensions ?? undefined,
    overfillProtectionNotes: asset.overfillProtectionNotes ?? undefined,
    integrityTestingBasis: asset.integrityTestingBasis ?? undefined,
    inspectionFrequencyDays: asset.inspectionFrequencyDays ?? undefined,
    comments: asset.comments ?? undefined,
    assetClass: asset.assetClass ?? undefined,
    modeState: asset.modeState ?? undefined,
    requiresSizedContainment: asset.requiresSizedContainment ?? false,
    underDirectControl: asset.underDirectControl ?? undefined,
    containmentValidationBasis: asset.containmentValidationBasis ?? undefined,
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Edit asset
        </h1>
        <p className="text-[var(--muted)] mt-1">
          {asset.assetCode} — {asset.name}
        </p>
      </div>
      <AssetForm
        facilityId={facilityId}
        assetId={assetId}
        oilTypes={oilTypes}
        containmentUnits={containmentUnits}
        initial={initial}
      />
    </div>
  );
}
