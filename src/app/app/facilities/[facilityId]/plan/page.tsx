import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrCreatePlan } from "@/lib/plan-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Plus,
  FileText,
  ChevronRight,
  Calendar,
  Shield,
  Clock,
  History,
} from "lucide-react";
import { CreateDraftVersionButton } from "./create-draft-button";
import { PlanReviewsCard } from "./plan-reviews-card";
import { PlanAmendmentsCard } from "./plan-amendments-card";

async function getFacility(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
    include: { profile: true },
  });
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    DRAFT: "bg-amber-100 text-amber-800 border-amber-200",
    IN_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    SUPERSEDED: "bg-[var(--mist-gray)] text-[var(--muted)] border-[var(--border)]",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variants[status] ?? "bg-[var(--mist-gray)]"}`}
    >
      {label}
    </span>
  );
}

export default async function PlanOverviewPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const [plan, reviews, amendments] = await Promise.all([
    getOrCreatePlan(facilityId),
    prisma.planReview.findMany({
      where: { facilityId },
      include: { planVersion: { select: { versionNumber: true, status: true } } },
      orderBy: { dueDate: "desc" },
      take: 5,
    }),
    prisma.planAmendment.findMany({
      where: { facilityId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const currentVersion = plan.currentVersion ?? plan.versions[0];
  const hasDraft = plan.versions.some(
    (v) => v.status === "DRAFT" || v.status === "IN_REVIEW"
  );
  const nextReview = facility.profile?.nextFiveYearReviewDate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            SPCC Plan
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Structured, versioned compliance plan for {facility.name}
          </p>
        </div>
        {!hasDraft && currentVersion?.status === "APPROVED" && (
          <CreateDraftVersionButton facilityId={facilityId} />
        )}
      </div>

      {/* Current version summary */}
      {currentVersion ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Current version</h2>
              <StatusBadge status={currentVersion.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--muted)]" />
                <span className="text-sm">
                  Version {currentVersion.versionNumber}
                </span>
              </div>
              {currentVersion.effectiveDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--muted)]" />
                  <span className="text-sm">
                    Effective{" "}
                    {new Date(currentVersion.effectiveDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {currentVersion.certificationType && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[var(--muted)]" />
                  <span className="text-sm">
                    {currentVersion.certificationType.replace(/_/g, " ")}
                  </span>
                </div>
              )}
              {nextReview && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--muted)]" />
                  <span className="text-sm">
                    5-year review due{" "}
                    {new Date(nextReview).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button asChild variant="default">
                <Link
                  href={`/app/facilities/${facilityId}/plan/${currentVersion.id}`}
                >
                  View plan
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              {hasDraft && (
                <Button asChild variant="outline">
                  <Link
                    href={`/app/facilities/${facilityId}/plan/${plan.versions.find((v) => v.status === "DRAFT" || v.status === "IN_REVIEW")?.id}`}
                  >
                    Continue editing draft
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--muted)] mb-4">
              No plan versions yet. Create your first draft to get started.
            </p>
            <CreateDraftVersionButton facilityId={facilityId} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Version history */}
        <Card>
          <CardHeader>
            <h2 className="font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              Version history
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plan.versions.map((v) => (
                <Link
                  key={v.id}
                  href={`/app/facilities/${facilityId}/plan/${v.id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-[var(--mist-gray)]/50"
                >
                  <span className="text-sm font-medium">
                    Version {v.versionNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={v.status} />
                    <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews & amendments */}
        <div className="space-y-4">
          <PlanReviewsCard
            facilityId={facilityId}
            reviews={reviews}
            currentVersionId={currentVersion?.id}
          />
          <PlanAmendmentsCard facilityId={facilityId} amendments={amendments} />
        </div>
      </div>
    </div>
  );
}
