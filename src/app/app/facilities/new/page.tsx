import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateFacilityForm } from "./create-facility-form";

export default async function NewFacilityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orgMembership = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (!orgMembership) redirect("/app");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          New facility
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Add a new facility to your organization
        </p>
      </div>
      <CreateFacilityForm userId={session.user.id} />
    </div>
  );
}
