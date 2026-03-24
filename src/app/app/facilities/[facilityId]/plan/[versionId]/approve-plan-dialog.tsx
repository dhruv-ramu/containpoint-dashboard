"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield } from "lucide-react";

export function ApprovePlanDialog({
  facilityId,
  versionId,
}: {
  facilityId: string;
  versionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [certifiedByName, setCertifiedByName] = useState("");
  const [certifiedByTitle, setCertifiedByTitle] = useState("");
  const [certificationDate, setCertificationDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [siteVisitDate, setSiteVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [certificationType, setCertificationType] = useState<
    "OWNER_OPERATOR_SELF_CERTIFIED" | "PE_CERTIFIED"
  >("OWNER_OPERATOR_SELF_CERTIFIED");
  const router = useRouter();

  async function handleApprove() {
    if (!certifiedByName.trim()) {
      alert("Certifier name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/plan/versions/${versionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approve: true,
            certification: {
              certificationType,
              certifiedByName: certifiedByName.trim(),
              certifiedByTitle: certifiedByTitle.trim() || undefined,
              certificationDate,
              siteVisitDate: siteVisitDate || undefined,
              notes: notes.trim() || undefined,
            },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to approve");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Shield className="h-4 w-4" />
          Approve & lock version
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve plan version</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-[var(--muted)]">
            Once approved, this version will be locked and become the current
            plan. Certification details will be recorded.
          </p>
          <div className="space-y-2">
            <Label>Certification type</Label>
            <select
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
              value={certificationType}
              onChange={(e) =>
                setCertificationType(
                  e.target.value as "OWNER_OPERATOR_SELF_CERTIFIED" | "PE_CERTIFIED"
                )
              }
            >
              <option value="OWNER_OPERATOR_SELF_CERTIFIED">
                Owner/Operator self-certified
              </option>
              <option value="PE_CERTIFIED">PE certified</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="certifiedByName">Certifier name *</Label>
            <Input
              id="certifiedByName"
              value={certifiedByName}
              onChange={(e) => setCertifiedByName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certifiedByTitle">Title</Label>
            <Input
              id="certifiedByTitle"
              value={certifiedByTitle}
              onChange={(e) => setCertifiedByTitle(e.target.value)}
              placeholder="e.g. Facility Manager"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certificationDate">Certification date *</Label>
            <Input
              id="certificationDate"
              type="date"
              value={certificationDate}
              onChange={(e) => setCertificationDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteVisitDate">Site visit date</Label>
            <Input
              id="siteVisitDate"
              type="date"
              value={siteVisitDate}
              onChange={(e) => setSiteVisitDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading ? "Approving…" : "Approve & lock"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
