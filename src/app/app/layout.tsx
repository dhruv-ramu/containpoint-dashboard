import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orgMembership = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (!orgMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted)]">No organization found. Please contact support.</p>
        </div>
      </div>
    );
  }

  // ORG_ADMIN sees all facilities; others see only their assigned facilities
  const isOrgAdmin = orgMembership.role === "ORG_ADMIN";
  const facilities = isOrgAdmin
    ? (
        await prisma.facility.findMany({
          where: { organizationId: orgMembership.organizationId },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      )
    : (
        await prisma.facilityMembership.findMany({
          where: { userId: session.user.id },
          include: { facility: true },
          orderBy: { facility: { name: "asc" } },
        })
      ).map((m) => ({ id: m.facility.id, name: m.facility.name }));

  return (
    <AppShell
      orgName={orgMembership.organization.name}
      userName={session.user.name}
      userEmail={session.user.email}
      facilities={facilities}
    >
      {children}
    </AppShell>
  );
}
