"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react";

const EXPORT_TYPES = [
  { value: "FULL_AUDIT_PACK", label: "Full audit pack", description: "Comprehensive compliance bundle — profile, assets, containment, actions, training, incidents" },
  { value: "PLAN_PDF", label: "Plan summary", description: "Current SPCC plan version and effective dates" },
  { value: "CONTAINER_INVENTORY", label: "Container inventory", description: "Asset registry with capacity, oil type, and status" },
  { value: "CONTAINMENT_BASIS", label: "Containment basis", description: "Secondary containment units and capacities" },
  { value: "CORRECTIVE_ACTION_REGISTER", label: "Corrective action register", description: "Open and closed corrective actions" },
  { value: "TRAINING_LOG", label: "Training log", description: "Training events and attendee counts" },
  { value: "INSPECTION_REPORT", label: "Inspection report", description: "Inspection history and schedules" },
  { value: "REVIEW_MEMO", label: "Review memo", description: "5-year plan review status" },
  { value: "INCIDENT_LOG", label: "Incident log", description: "Spill and discharge incident records" },
] as const;

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    QUEUED: "bg-amber-50 text-amber-800 border-amber-200",
    PROCESSING: "bg-blue-50 text-blue-800 border-blue-200",
    COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    FAILED: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${variants[status] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}
    >
      {status === "COMPLETED" && <CheckCircle2 className="h-3 w-3" />}
      {status === "FAILED" && <AlertCircle className="h-3 w-3" />}
      {status}
    </span>
  );
}

type ExportJob = {
  id: string;
  exportType: string;
  status: string;
  requestedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
  requestedBy: { name: string | null } | null;
  artifacts: Array<{
    id: string;
    fileName: string;
    storageKey: string;
    mimeType: string;
    generatedAt: Date;
  }>;
};

export function ExportCenter({
  facilityId,
  exportJobs,
}: {
  facilityId: string;
  exportJobs: ExportJob[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedType, setSelectedType] = useState("FULL_AUDIT_PACK");

  const selectedExport = EXPORT_TYPES.find((t) => t.value === selectedType);

  async function handleRequest() {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/exports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportType: selectedType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create export");
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to create export");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-[var(--border)] overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--steel-blue)]/5 to-transparent border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--steel-blue)]" />
            Request export
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Generate compliance documents on demand. Exports are created instantly and appear in history below.
          </p>
        </div>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <label className="text-sm font-medium text-[var(--foreground)] block mb-2">
                Export type
              </label>
              <select
                className="w-full rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-[var(--steel-blue)]/20 focus:border-[var(--steel-blue)] transition-colors"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setError(null);
                }}
              >
                {EXPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {selectedExport?.description && (
                <p className="text-xs text-[var(--muted)] mt-2">
                  {selectedExport.description}
                </p>
              )}
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleRequest}
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Export created successfully. Check the history below to download.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[var(--foreground)]">Export history</h2>
          <p className="text-sm text-[var(--muted)]">
            Recent exports. Click to download completed documents.
          </p>
        </CardHeader>
        <CardContent>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                  <th className="text-left font-medium px-4 py-3">Type</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Requested</th>
                  <th className="text-left font-medium px-4 py-3">By</th>
                  <th className="text-right font-medium px-4 py-3">Download</th>
                </tr>
              </thead>
              <tbody>
                {exportJobs.map((j) => (
                  <tr
                    key={j.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">
                      {EXPORT_TYPES.find((t) => t.value === j.exportType)?.label ??
                        j.exportType.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={j.status} />
                        {j.errorMessage && (
                          <span className="text-red-600 text-xs max-w-[200px]">
                            {j.errorMessage}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {new Date(j.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{j.requestedBy?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {j.artifacts.length > 0 ? (
                        <a
                          href={`/api/facilities/${facilityId}/exports/${j.id}/download`}
                          download
                          className="inline-flex items-center gap-1.5 text-[var(--steel-blue)] hover:underline font-medium"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {exportJobs.length === 0 && (
              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--mist-gray)] mb-4">
                  <Download className="h-7 w-7 text-[var(--muted)]" />
                </div>
                <p className="font-medium text-[var(--foreground)]">No exports yet</p>
                <p className="text-sm text-[var(--muted)] mt-1 max-w-sm mx-auto">
                  Select an export type above and click Generate to create your first compliance document.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
