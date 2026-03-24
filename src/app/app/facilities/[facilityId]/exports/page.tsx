import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import { ExportCenter } from "./export-center";

async function getFacility(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
  });
}

export default async function ExportsPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const exportJobs = await prisma.exportJob.findMany({
    where: { facilityId },
    include: {
      artifacts: true,
      requestedBy: { select: { name: true } },
    },
    orderBy: { requestedAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Export center
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Generate and download compliance documents for {facility.name}
        </p>
      </div>

      <ExportCenter facilityId={facilityId} exportJobs={exportJobs} />
    </div>
  );
}
