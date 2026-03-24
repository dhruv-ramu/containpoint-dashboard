import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Box,
  Container,
  FileText,
  ChevronRight,
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import type { ValidationOutput } from "@/lib/validation";

type FacilityWithRelations = {
  id: string;
  name: string;
  profile: {
    legalName?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    nextFiveYearReviewDate?: Date | null;
  } | null;
  accountablePerson: { name: string } | null;
  applicability: { spccApplicable: boolean }[];
  qualification: { tier: string; qualifiedFacility: boolean }[];
  _count: { assets: number; containmentUnits: number; files: number };
};

type ScheduledInspectionWithRelations = {
  id: string;
  dueDate: Date;
  template: { name: string } | null;
  asset: { name: string } | null;
};

type CorrectiveActionWithAsset = {
  id: string;
  title: string;
  dueDate: Date | null;
  asset: { name: string } | null;
};

type Props = {
  facility: FacilityWithRelations;
  validation: ValidationOutput;
  overdueInspections: ScheduledInspectionWithRelations[];
  overdueActions: CorrectiveActionWithAsset[];
  upcomingInspections: ScheduledInspectionWithRelations[];
  trainingSummary: { hasRecentBriefing: boolean; latestDate?: Date | null };
};

export function FacilityDashboard({
  facility,
  validation,
  overdueInspections,
  overdueActions,
  upcomingInspections,
  trainingSummary,
}: Props) {
  const q = facility.qualification[0];
  const a = facility.applicability[0];
  const tier = q?.tier ?? "—";
  const applicable = a?.spccApplicable ? "Yes" : a ? "No" : "—";
  const profileComplete = !!(
    facility.profile &&
    facility.profile.legalName &&
    facility.profile.addressLine1 &&
    facility.profile.city &&
    facility.profile.state
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          {facility.name}
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Compliance overview and quick actions
        </p>
      </div>

      {/* Compliance status row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={
            validation.overallStatus === "NONCOMPLIANT"
              ? "border-red-200 bg-red-50/50"
              : validation.overallStatus === "AT_RISK"
                ? "border-amber-200 bg-amber-50/50"
                : "border-green-200 bg-green-50/50"
          }
        >
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[var(--muted)]">Compliance status</p>
            <p
              className={`mt-1 font-semibold ${
                validation.overallStatus === "NONCOMPLIANT"
                  ? "text-red-700"
                  : validation.overallStatus === "AT_RISK"
                    ? "text-amber-700"
                    : "text-green-700"
              }`}
            >
              {validation.overallStatus.replace(/_/g, " ")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[var(--muted)]">Hard failures</p>
            <p className="mt-1 font-semibold text-red-700">
              {validation.hardFailures.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[var(--muted)]">Risk flags</p>
            <p className="mt-1 font-semibold text-amber-700">
              {validation.riskFlags.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[var(--muted)]">Accountable person</p>
            <p className="mt-1 font-medium truncate">
              {facility.accountablePerson?.name ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue & upcoming sections */}
      {(overdueInspections.length > 0 || overdueActions.length > 0 || upcomingInspections.length > 0) && (
        <div className="grid gap-4 md:grid-cols-3">
          {overdueInspections.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Overdue inspections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {overdueInspections.slice(0, 3).map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/app/facilities/${facility.id}/inspections/schedule/${s.id}/run`}
                        className="hover:underline text-amber-800"
                      >
                        {s.template?.name ?? "Inspection"} · {s.asset?.name ?? "—"}
                      </Link>
                      <span className="text-[var(--muted)] ml-1">
                        Due {new Date(s.dueDate).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" size="sm" asChild className="mt-2">
                  <Link href={`/app/facilities/${facility.id}/inspections`}>
                    View all
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {overdueActions.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Overdue corrective actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {overdueActions.slice(0, 3).map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/app/facilities/${facility.id}/corrective-actions/${a.id}`}
                        className="hover:underline text-amber-800"
                      >
                        {a.title}
                      </Link>
                      <span className="text-[var(--muted)] ml-1">
                        {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" size="sm" asChild className="mt-2">
                  <Link href={`/app/facilities/${facility.id}/corrective-actions`}>
                    View all
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {upcomingInspections.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Upcoming inspections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {upcomingInspections.slice(0, 3).map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/app/facilities/${facility.id}/inspections/schedule/${s.id}/run`}
                        className="hover:underline"
                      >
                        {s.template?.name ?? "Inspection"} · {s.asset?.name ?? "—"}
                      </Link>
                      <span className="text-[var(--muted)] ml-1">
                        {new Date(s.dueDate).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" size="sm" asChild className="mt-2">
                  <Link href={`/app/facilities/${facility.id}/inspections`}>
                    View all
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Training status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Training status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-sm font-medium ${
              trainingSummary.hasRecentBriefing ? "text-green-600" : "text-amber-600"
            }`}
          >
            {trainingSummary.hasRecentBriefing
              ? "Annual briefing within 365 days"
              : "No annual briefing in last 365 days"}
          </p>
          {trainingSummary.latestDate && (
            <p className="text-xs text-[var(--muted)] mt-1">
              Last briefing: {new Date(trainingSummary.latestDate).toLocaleDateString()}
            </p>
          )}
          <Button variant="ghost" size="sm" asChild className="mt-2">
            <Link href={`/app/facilities/${facility.id}/training`}>
              View training
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Summary row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[var(--muted)]">Qualification tier</p>
            <p className="mt-1 font-medium">{String(tier).replace(/_/g, " ")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[var(--muted)]">SPCC applicable</p>
            <p className="mt-1 font-medium">{applicable}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[var(--muted)]">Assets</p>
            <p className="mt-1 font-medium">{facility._count.assets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[var(--muted)]">Containment units</p>
            <p className="mt-1 font-medium">{facility._count.containmentUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[var(--muted)]">Next 5-yr review</p>
            <p className="mt-1 font-medium">
              {facility.profile?.nextFiveYearReviewDate
                ? new Date(facility.profile.nextFiveYearReviewDate).toLocaleDateString()
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Facility profile</CardTitle>
            <p className="text-sm text-[var(--muted)]">
              Legal name, address, operating details
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium ${
                  profileComplete ? "text-green-600" : "text-amber-600"
                }`}
              >
                {profileComplete ? "Complete" : "Incomplete"}
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/app/facilities/${facility.id}/profile`}>
                  <FileText className="h-4 w-4 mr-1" />
                  Edit
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Setup status</CardTitle>
            <p className="text-sm text-[var(--muted)]">
              Applicability and qualification wizard
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">
                {a ? "Assessed" : "Not assessed"}
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/app/facilities/${facility.id}/setup`}>
                  <ClipboardList className="h-4 w-4 mr-1" />
                  {a ? "Review" : "Start"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Asset registry</CardTitle>
            <p className="text-sm text-[var(--muted)]">
              Oil storage containers and equipment
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{facility._count.assets} assets</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/app/facilities/${facility.id}/assets`}>
                  <Box className="h-4 w-4 mr-1" />
                  Manage
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Containment registry</CardTitle>
            <p className="text-sm text-[var(--muted)]">
              Secondary containment structures
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {facility._count.containmentUnits} units
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/app/facilities/${facility.id}/containment`}>
                  <Container className="h-4 w-4 mr-1" />
                  Manage
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif">File attachments</CardTitle>
            <p className="text-sm text-[var(--muted)]">
              Plans, calculations, inspection evidence
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{facility._count.files} files</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/app/facilities/${facility.id}/profile`}>
                  View in profile
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
