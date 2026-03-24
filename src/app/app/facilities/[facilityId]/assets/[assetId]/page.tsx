import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function getAsset(facilityId: string, assetId: string, userId: string) {
  return prisma.asset.findFirst({
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
      containmentLinks: {
        include: { containmentUnit: true },
      },
    },
  });
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ facilityId: string; assetId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId, assetId } = await params;
  const asset = await getAsset(facilityId, assetId, session.user.id);
  if (!asset) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {asset.assetCode} — {asset.name}
          </h1>
          <p className="text-[var(--muted)] mt-1">
            {asset.assetType.replace(/_/g, " ")} • {asset.oilType?.label ?? "No oil type"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/facilities/${facilityId}/assets/${assetId}/edit`}>
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
            <span className="text-[var(--muted)]">Capacity</span>
            <span>
              {asset.storageCapacityGallons != null
                ? `${asset.storageCapacityGallons.toLocaleString()} gal`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Aboveground</span>
            <span>{asset.aboveground ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Threshold counted</span>
            <span>{asset.countedTowardThreshold ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Status</span>
            <span>{asset.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Last inspection</span>
            <span>
              {asset.lastInspectionDate
                ? new Date(asset.lastInspectionDate).toLocaleDateString()
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Next inspection</span>
            <span>
              {asset.nextInspectionDate
                ? new Date(asset.nextInspectionDate).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {asset.containmentLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked containment</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {asset.containmentLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={`/app/facilities/${facilityId}/containment`}
                    className="text-[var(--steel-blue)] hover:underline"
                  >
                    {link.containmentUnit.code} — {link.containmentUnit.name}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {asset.comments && (
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{asset.comments}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href={`/app/facilities/${facilityId}/assets`}>Back to list</Link>
        </Button>
      </div>
    </div>
  );
}
