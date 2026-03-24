import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
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
    include: { assets: { where: { status: "ACTIVE" }, select: { id: true, assetCode: true, name: true } } },
  });
}

export default async function NewIncidentPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

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
          Log incident / discharge
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Record a spill or discharge for {facility.name}
        </p>
      </div>
      <IncidentForm facilityId={facilityId} assets={facility.assets} />
    </div>
  );
}
