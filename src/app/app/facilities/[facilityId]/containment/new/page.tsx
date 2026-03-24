import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ContainmentForm } from "../containment-form";

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

export default async function NewContainmentPage({
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Add containment unit
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Register a secondary containment structure
        </p>
      </div>
      <ContainmentForm facilityId={facilityId} />
    </div>
  );
}
