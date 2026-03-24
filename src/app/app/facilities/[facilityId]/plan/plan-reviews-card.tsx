"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Check } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    UPCOMING: "bg-slate-100 text-slate-800",
    DUE: "bg-amber-100 text-amber-800",
    OVERDUE: "bg-red-100 text-red-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${variants[status] ?? ""}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

type Review = {
  id: string;
  dueDate: Date;
  status: string;
  planVersion: { versionNumber: number };
};

export function PlanReviewsCard({
  facilityId,
  reviews,
  currentVersionId,
}: {
  facilityId: string;
  reviews: Review[];
  currentVersionId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [summary, setSummary] = useState("");
  const [requiresAmendment, setRequiresAmendment] = useState(false);
  const [amendmentDescription, setAmendmentDescription] = useState("");
  const [createAmendment, setCreateAmendment] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/plan/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: new Date(dueDate).toISOString(),
          planVersionId: currentVersionId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setOpen(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(reviewId: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/plan/reviews/${reviewId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            complete: true,
            summary,
            requiresAmendment,
            createAmendment: requiresAmendment,
            amendmentDescription:
              requiresAmendment && amendmentDescription
                ? amendmentDescription
                : undefined,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to complete");
      setCompleteOpen(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const incompleteReviews = reviews.filter((r) => r.status !== "COMPLETED");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="font-medium">5-year reviews</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Schedule review
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule 5-year review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
        {reviews.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-4">No reviews yet</p>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between text-sm py-2 border-b border-[var(--border)] last:border-0"
              >
                <span>
                  Due {new Date(r.dueDate).toLocaleDateString()} · v
                  {r.planVersion.versionNumber}
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.status !== "COMPLETED" && (
                    <Dialog
                      open={completeOpen === r.id}
                      onOpenChange={(o) => {
                        setCompleteOpen(o ? r.id : null);
                        if (!o) {
                          setSummary("");
                          setRequiresAmendment(false);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Check className="h-4 w-4" />
                          Complete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Complete review</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Summary</Label>
                            <Textarea
                              value={summary}
                              onChange={(e) => setSummary(e.target.value)}
                              placeholder="Review summary"
                              rows={2}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="requiresAmendment"
                              checked={requiresAmendment}
                              onCheckedChange={(c) =>
                                setRequiresAmendment(!!c)
                              }
                            />
                            <Label htmlFor="requiresAmendment">
                              Requires amendment
                            </Label>
                          </div>
                          {requiresAmendment && (
                            <div>
                              <Label>Amendment description</Label>
                              <Textarea
                                value={amendmentDescription}
                                onChange={(e) =>
                                  setAmendmentDescription(e.target.value)
                                }
                                placeholder="Describe amendment required"
                                rows={2}
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <Checkbox
                                  id="createAmendment"
                                  checked={createAmendment}
                                  onCheckedChange={(c) =>
                                    setCreateAmendment(!!c)
                                  }
                                />
                                <Label htmlFor="createAmendment">
                                  Create amendment record
                                </Label>
                              </div>
                            </div>
                          )}
                          <Button
                            onClick={() => handleComplete(r.id)}
                            disabled={loading}
                          >
                            {loading ? "Completing…" : "Complete review"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
