"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const EXPORT_TYPES = [
  { value: "PLAN_PDF", label: "Plan (PDF)" },
  { value: "INSPECTION_REPORT", label: "Inspection report" },
  { value: "CORRECTIVE_ACTION_REGISTER", label: "Corrective action register" },
  { value: "TRAINING_LOG", label: "Training log" },
  { value: "CONTAINER_INVENTORY", label: "Container inventory" },
  { value: "CONTAINMENT_BASIS", label: "Containment basis" },
  { value: "REVIEW_MEMO", label: "Review memo" },
  { value: "INCIDENT_LOG", label: "Incident log" },
  { value: "FULL_AUDIT_PACK", label: "Full audit pack" },
] as const;

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    QUEUED: "bg-slate-100 text-slate-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    FAILED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${variants[status] ?? ""}`}
    >
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
  const [selectedType, setSelectedType] = useState("FULL_AUDIT_PACK");

  async function handleRequest() {
    setLoading(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/exports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportType: selectedType }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create export");
      }
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to create export");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="font-medium">Request export</h2>
          <p className="text-sm text-[var(--muted)]">
            Generate compliance documents. Exports are generated on demand.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium block mb-1">
                Export type
              </label>
              <select
                className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm min-w-[200px]"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {EXPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleRequest} disabled={loading}>
              <Download className="h-4 w-4" />
              {loading ? "Requesting…" : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-medium">Export history</h2>
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
                  <th className="text-left font-medium px-4 py-3">Artifacts</th>
                </tr>
              </thead>
              <tbody>
                {exportJobs.map((j) => (
                  <tr
                    key={j.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--mist-gray)]/50"
                  >
                    <td className="px-4 py-3">
                      {EXPORT_TYPES.find((t) => t.value === j.exportType)?.label ??
                        j.exportType.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={j.status} />
                      {j.errorMessage && (
                        <span className="ml-2 text-red-600 text-xs">
                          {j.errorMessage}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(j.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{j.requestedBy?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {j.artifacts.length > 0 ? (
                        <a
                          href={`/api/facilities/${facilityId}/exports/${j.id}/download`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          Download ({j.artifacts.length})
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {exportJobs.length === 0 && (
              <div className="py-12 text-center text-[var(--muted)]">
                <Download className="mx-auto h-12 w-12 opacity-40 mb-4" />
                <p>No exports yet</p>
                <p className="text-sm mt-1">
                  Request an export above to generate documents
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
