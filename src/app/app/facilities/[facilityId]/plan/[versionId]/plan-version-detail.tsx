"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ApprovePlanDialog } from "./approve-plan-dialog";
import { SectionViewer } from "./section-viewer";

type VersionWithRelations = {
  id: string;
  versionNumber: number;
  status: string;
  effectiveDate: Date | null;
  sections: Array<{
    id: string;
    sectionKey: string;
    title: string;
    narrativeText: string | null;
    structuredDataJson: unknown;
    contentMode: string;
    generatedFromSystem: boolean;
  }>;
  certifications: Array<{
    id: string;
    certifiedByName: string;
    certifiedByTitle: string | null;
    certificationType: string;
    certificationDate: Date;
    siteVisitDate: Date | null;
    notes: string | null;
  }>;
  createdBy: { name: string | null } | null;
  approvedBy: { name: string | null } | null;
};

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    DRAFT: "bg-amber-100 text-amber-800 border-amber-200",
    IN_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    SUPERSEDED: "bg-[var(--mist-gray)] text-[var(--muted)] border-[var(--border)]",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
        variants[status] ?? "bg-[var(--mist-gray)]"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function PlanVersionDetail({
  facilityId,
  facilityName,
  version,
  currentSectionKey,
  userId,
}: {
  facilityId: string;
  facilityName: string;
  version: VersionWithRelations;
  currentSectionKey: string | null;
  userId: string;
}) {
  const canEdit = version.status === "DRAFT" || version.status === "IN_REVIEW";
  const selectedSection = currentSectionKey
    ? version.sections.find((s) => s.sectionKey === currentSectionKey)
    : version.sections[0];

  return (
    <div className="flex gap-6">
      {/* Section sidebar */}
      <aside className="w-56 shrink-0">
        <Card>
          <CardHeader className="py-3">
            <h2 className="text-sm font-medium">Sections</h2>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="flex flex-col">
              {version.sections.map((s) => {
                const href = `/app/facilities/${facilityId}/plan/${version.id}?section=${encodeURIComponent(s.sectionKey)}`;
                const isActive = selectedSection?.id === s.id;
                return (
                  <Link
                    key={s.id}
                    href={href}
                    className={cn(
                      "px-3 py-2.5 text-sm border-b border-[var(--border)] last:border-b-0 transition-colors",
                      isActive
                        ? "bg-[var(--mist-gray)] font-medium"
                        : "hover:bg-[var(--mist-gray)]/50"
                    )}
                  >
                    <span className="block truncate">{s.title}</span>
                    {s.generatedFromSystem && (
                      <span className="text-xs text-[var(--muted)]">System</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Version header */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-xl font-semibold tracking-tight">
                  Version {version.versionNumber}
                </h1>
                <p className="text-sm text-[var(--muted)] mt-0.5">
                  {version.effectiveDate
                    ? `Effective ${new Date(version.effectiveDate).toLocaleDateString()}`
                    : "Not yet approved"}{" "}
                  · Created by {version.createdBy?.name ?? "Unknown"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={version.status} />
                {canEdit && (
                  <ApprovePlanDialog
                    facilityId={facilityId}
                    versionId={version.id}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certification block (when approved) */}
        {version.status === "APPROVED" && version.certifications.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Certification</h2>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {version.certifications.map((c) => (
                <div key={c.id}>
                  <p>
                    <strong>{c.certifiedByName}</strong>
                    {c.certifiedByTitle && `, ${c.certifiedByTitle}`}
                  </p>
                  <p className="text-[var(--muted)]">
                    {c.certificationType.replace(/_/g, " ")} ·{" "}
                    {new Date(c.certificationDate).toLocaleDateString()}
                    {c.siteVisitDate &&
                      ` · Site visit ${new Date(c.siteVisitDate).toLocaleDateString()}`}
                  </p>
                  {c.notes && (
                    <p className="mt-2 text-[var(--muted)]">{c.notes}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Section content */}
        <Card>
          <CardContent className="py-6">
            {selectedSection ? (
              <SectionViewer
                facilityId={facilityId}
                versionId={version.id}
                section={selectedSection}
                canEdit={canEdit}
              />
            ) : (
              <p className="text-[var(--muted)]">Select a section</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
