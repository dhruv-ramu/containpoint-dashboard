"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    OPEN: "bg-slate-100 text-slate-800",
    DRAFTING: "bg-blue-100 text-blue-800",
    READY_FOR_APPROVAL: "bg-amber-100 text-amber-800",
    IMPLEMENTED: "bg-emerald-100 text-emerald-800",
    CLOSED: "bg-[var(--mist-gray)] text-[var(--muted)]",
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${variants[status] ?? ""}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

const AMENDMENT_TYPES = [
  { value: "FIVE_YEAR_REVIEW", label: "5-year review" },
  { value: "ASSET_CHANGE", label: "Asset change" },
  { value: "OWNERSHIP_CHANGE", label: "Ownership change" },
  { value: "INCIDENT", label: "Incident" },
  { value: "PROCEDURAL_CHANGE", label: "Procedural change" },
  { value: "CONSULTANT_RECOMMENDATION", label: "Consultant recommendation" },
];

type Amendment = {
  id: string;
  amendmentType: string;
  description: string;
  status: string;
  dueBy: Date | null;
};

export function PlanAmendmentsCard({
  facilityId,
  amendments,
}: {
  facilityId: string;
  amendments: Amendment[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amendmentType, setAmendmentType] = useState("FIVE_YEAR_REVIEW");
  const [description, setDescription] = useState("");
  const [dueBy, setDueBy] = useState("");

  async function handleCreate() {
    if (!description.trim()) {
      alert("Description is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/plan/amendments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amendmentType,
            description: description.trim(),
            dueBy: dueBy || undefined,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to create");
      setOpen(false);
      setDescription("");
      setDueBy("");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="font-medium">Amendments</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add amendment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create amendment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Type</Label>
                <select
                  className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={amendmentType}
                  onChange={(e) => setAmendmentType(e.target.value)}
                >
                  {AMENDMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the amendment"
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label>Due by</Label>
                <Input
                  type="date"
                  value={dueBy}
                  onChange={(e) => setDueBy(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Creating…" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {amendments.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-4">No amendments yet</p>
        ) : (
          <div className="space-y-2">
            {amendments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-sm py-2 border-b border-[var(--border)] last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium block truncate">
                    {AMENDMENT_TYPES.find((t) => t.value === a.amendmentType)
                      ?.label ?? a.amendmentType.replace(/_/g, " ")}
                  </span>
                  <span className="text-[var(--muted)] truncate block">
                    {a.description.slice(0, 80)}
                    {a.description.length > 80 ? "…" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <StatusBadge status={a.status} />
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href={`/app/facilities/${facilityId}/plan?amendment=${a.id}`}
                    >
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
