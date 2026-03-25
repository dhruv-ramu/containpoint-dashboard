import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FacilityScopeProvider } from "@/components/app-shell/facility-context";
import { FacilityScopeStrip } from "@/components/app-shell/facility-scope-strip";

export default async function FacilityScopedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { facilityId } = await params;
  const facility = await prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId: session.user.id, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
    select: { id: true, name: true },
  });

  if (!facility) notFound();

  return (
    <FacilityScopeProvider value={facility}>
      <div className="mb-5 pb-4 border-b border-[var(--border)]">
        <FacilityScopeStrip />
      </div>
      {children}
    </FacilityScopeProvider>
  );
}
