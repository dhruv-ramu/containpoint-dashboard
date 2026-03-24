import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Box,
  Container,
  FileText,
  ChevronRight,
} from "lucide-react";

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

export function FacilityDashboard({ facility }: { facility: FacilityWithRelations }) {
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
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[var(--muted)]">Accountable person</p>
            <p className="mt-1 font-medium truncate">
              {facility.accountablePerson?.name ?? "—"}
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
