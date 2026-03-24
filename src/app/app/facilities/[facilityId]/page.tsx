import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FacilityDashboard } from "./facility-dashboard";

async function getFacility(facilityId: string, userId: string) {
  const facility = await prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
    include: {
      profile: true,
      accountablePerson: true,
      applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
      qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
      _count: { select: { assets: true, containmentUnits: true, files: true } },
    },
  });
  return facility;
}

export default async function FacilityPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  return <FacilityDashboard facility={facility} />;
}
