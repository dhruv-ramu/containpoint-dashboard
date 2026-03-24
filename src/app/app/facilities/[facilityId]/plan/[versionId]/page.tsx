import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { PlanVersionDetail } from "./plan-version-detail";

async function getFacility(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
    select: { id: true, name: true },
  });
}

async function getVersion(facilityId: string, versionId: string) {
  return prisma.planVersion.findFirst({
    where: { id: versionId, facilityId },
    include: {
      sections: { orderBy: { sectionOrder: "asc" } },
      certifications: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  });
}

export default async function PlanVersionPage({
  params,
  searchParams,
}: {
  params: Promise<{ facilityId: string; versionId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId, versionId } = await params;
  const { section: sectionKey } = await searchParams;

  const [facility, version] = await Promise.all([
    getFacility(facilityId, session.user.id),
    getVersion(facilityId, versionId),
  ]);

  if (!facility || !version) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/app/facilities/${facilityId}/plan`}>
            <ChevronLeft className="h-4 w-4" />
            Plan
          </Link>
        </Button>
      </div>
      <PlanVersionDetail
        facilityId={facilityId}
        facilityName={facility.name}
        version={version}
        currentSectionKey={sectionKey ?? null}
        userId={session.user.id}
      />
    </div>
  );
}
