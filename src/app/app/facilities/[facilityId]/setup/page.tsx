import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SetupWizard } from "./setup-wizard";

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
      profile: true,
      accountablePerson: true,
      applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
      qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
    },
  });
}

export default async function SetupPage({
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Facility setup
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Applicability and qualification wizard for {facility.name}
        </p>
      </div>
      <SetupWizard
        facilityId={facility.id}
        facilityName={facility.name}
        initialProfile={facility.profile}
        initialAccountable={facility.accountablePerson}
        initialApplicability={facility.applicability[0]}
        initialQualification={facility.qualification[0]}
        userId={session.user.id}
      />
    </div>
  );
}
