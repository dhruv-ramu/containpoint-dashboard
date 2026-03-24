import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default async function CorrectiveActionDetailPage({
  params,
}: {
  params: Promise<{ facilityId: string; actionId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId, actionId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const action = await prisma.correctiveAction.findFirst({
    where: { id: actionId, facilityId },
    include: {
      asset: true,
      owner: { select: { name: true } },
      verifiedBy: { select: { name: true } },
      regulatoryRequirement: true,
    },
  });

  if (!action) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {action.title}
          </h1>
          <p className="text-[var(--muted)] mt-1">
            {action.severity} · {action.status.replace(/_/g, " ")}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/app/facilities/${facilityId}/corrective-actions`}>
            Back to list
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <h2 className="font-medium mb-3">Details</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Asset</dt>
              <dd>{action.asset?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Owner</dt>
              <dd>{action.owner?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Due date</dt>
              <dd>
                {action.dueDate
                  ? new Date(action.dueDate).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Trigger</dt>
              <dd>{action.triggerCategory ?? "—"}</dd>
            </div>
            {action.regulatoryRequirement && (
              <div>
                <dt className="text-[var(--muted)]">Regulatory requirement</dt>
                <dd>
                  {action.regulatoryRequirement.requirementCode} –{" "}
                  {action.regulatoryRequirement.title}
                </dd>
              </div>
            )}
          </dl>
          {action.description && (
            <div className="mt-4">
              <dt className="text-[var(--muted)] text-sm">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap">{action.description}</dd>
            </div>
          )}
          {action.rootCause && (
            <div className="mt-4">
              <dt className="text-[var(--muted)] text-sm">Root cause</dt>
              <dd className="mt-1 whitespace-pre-wrap">{action.rootCause}</dd>
            </div>
          )}
          {action.closureNote && (
            <div className="mt-4">
              <dt className="text-[var(--muted)] text-sm">Closure note</dt>
              <dd className="mt-1 whitespace-pre-wrap">{action.closureNote}</dd>
            </div>
          )}
          {action.status === "ACCEPTED_RISK" && action.acceptedRiskJustification && (
            <div className="mt-4">
              <dt className="text-[var(--muted)] text-sm">Accepted risk justification</dt>
              <dd className="mt-1 whitespace-pre-wrap">{action.acceptedRiskJustification}</dd>
            </div>
          )}
          {action.verifiedAt && (
            <div className="mt-4">
              <dt className="text-[var(--muted)] text-sm">Verified by</dt>
              <dd className="mt-1">
                {action.verifiedBy?.name ?? "—"} on{" "}
                {new Date(action.verifiedAt).toLocaleString()}
              </dd>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
