import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const orgMembership = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Account and organization settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Name</span>
            <span>{session.user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Email</span>
            <span>{session.user.email}</span>
          </div>
        </CardContent>
      </Card>

      {orgMembership && (
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Current organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Name</span>
              <span>{orgMembership.organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Role</span>
              <span>{orgMembership.role.replace(/_/g, " ")}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
