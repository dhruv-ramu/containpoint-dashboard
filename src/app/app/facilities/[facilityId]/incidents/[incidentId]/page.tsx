import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { IncidentForm } from "../incident-form";

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
      assets: {
        where: { status: "ACTIVE" },
        select: { id: true, assetCode: true, name: true },
      },
    },
  });
}

async function getIncident(facilityId: string, incidentId: string) {
  return prisma.incident.findFirst({
    where: { id: incidentId, facilityId },
    include: { sourceAsset: { select: { id: true, assetCode: true, name: true } } },
  });
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ facilityId: string; incidentId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId, incidentId } = await params;
  const [facility, incident] = await Promise.all([
    getFacility(facilityId, session.user.id),
    getIncident(facilityId, incidentId),
  ]);

  if (!facility || !incident) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/app/facilities/${facilityId}/incidents`}>
            <ChevronLeft className="h-4 w-4" />
            Incidents
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          {incident.title}
        </h1>
        <p className="text-[var(--muted)] mt-1">
          {new Date(incident.occurredAt).toLocaleDateString()} ·{" "}
          {incident.severity.replace(/_/g, " ")}
        </p>
      </div>
      <IncidentForm
        facilityId={facilityId}
        assets={facility.assets}
        initial={{
          id: incident.id,
          title: incident.title,
          occurredAt: incident.occurredAt.toISOString(),
          sourceAssetId: incident.sourceAssetId,
          estimatedTotalSpilledGallons: incident.estimatedTotalSpilledGallons,
          estimatedAmountToWaterGallons: incident.estimatedAmountToWaterGallons,
          impactedWaterbody: incident.impactedWaterbody,
          cause: incident.cause,
          immediateActions: incident.immediateActions,
          notes: incident.notes,
          severity: incident.severity,
        }}
      />
    </div>
  );
}
