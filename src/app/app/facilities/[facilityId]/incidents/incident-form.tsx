"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type Asset = { id: string; assetCode: string; name: string };

export function IncidentForm({
  facilityId,
  assets,
  initial,
}: {
  facilityId: string;
  assets: Asset[];
  initial?: {
    id: string;
    title: string;
    occurredAt: string;
    sourceAssetId?: string | null;
    estimatedTotalSpilledGallons?: number | null;
    estimatedAmountToWaterGallons?: number | null;
    impactedWaterbody?: string | null;
    cause?: string | null;
    immediateActions?: string | null;
    notes?: string | null;
    severity: string;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [occurredAt, setOccurredAt] = useState(
    initial?.occurredAt
      ? new Date(initial.occurredAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [sourceAssetId, setSourceAssetId] = useState(initial?.sourceAssetId ?? "");
  const [estimatedTotalSpilledGallons, setEstimatedTotalSpilledGallons] = useState(
    initial?.estimatedTotalSpilledGallons?.toString() ?? ""
  );
  const [estimatedAmountToWaterGallons, setEstimatedAmountToWaterGallons] = useState(
    initial?.estimatedAmountToWaterGallons?.toString() ?? ""
  );
  const [impactedWaterbody, setImpactedWaterbody] = useState(
    initial?.impactedWaterbody ?? ""
  );
  const [cause, setCause] = useState(initial?.cause ?? "");
  const [immediateActions, setImmediateActions] = useState(
    initial?.immediateActions ?? ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [severity, setSeverity] = useState(initial?.severity ?? "MEDIUM");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    setLoading(true);
    try {
      const url = initial
        ? `/api/facilities/${facilityId}/incidents/${initial.id}`
        : `/api/facilities/${facilityId}/incidents`;
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          occurredAt: new Date(occurredAt).toISOString(),
          sourceAssetId: sourceAssetId || null,
          estimatedTotalSpilledGallons: estimatedTotalSpilledGallons
            ? parseFloat(estimatedTotalSpilledGallons)
            : null,
          estimatedAmountToWaterGallons: estimatedAmountToWaterGallons
            ? parseFloat(estimatedAmountToWaterGallons)
            : null,
          impactedWaterbody: impactedWaterbody.trim() || null,
          cause: cause.trim() || null,
          immediateActions: immediateActions.trim() || null,
          notes: notes.trim() || null,
          severity,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save");
      }
      const data = await res.json();
      router.push(`/app/facilities/${facilityId}/incidents/${data.incident?.id ?? initial?.id}`);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Diesel leak from Tank 1"
              required
            />
          </div>
          <div>
            <Label htmlFor="occurredAt">Date and time *</Label>
            <Input
              id="occurredAt"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="severity">Severity</Label>
            <select
              id="severity"
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div>
            <Label htmlFor="sourceAssetId">Source asset</Label>
            <select
              id="sourceAssetId"
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
              value={sourceAssetId}
              onChange={(e) => setSourceAssetId(e.target.value)}
            >
              <option value="">— Select —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetCode} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="estimatedTotalSpilledGallons">
                Est. total spilled (gal)
              </Label>
              <Input
                id="estimatedTotalSpilledGallons"
                type="number"
                min={0}
                step={0.1}
                value={estimatedTotalSpilledGallons}
                onChange={(e) => setEstimatedTotalSpilledGallons(e.target.value)}
                placeholder="—"
              />
            </div>
            <div>
              <Label htmlFor="estimatedAmountToWaterGallons">
                Est. amount to water (gal)
              </Label>
              <Input
                id="estimatedAmountToWaterGallons"
                type="number"
                min={0}
                step={0.1}
                value={estimatedAmountToWaterGallons}
                onChange={(e) => setEstimatedAmountToWaterGallons(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="impactedWaterbody">Impacted waterbody</Label>
            <Input
              id="impactedWaterbody"
              value={impactedWaterbody}
              onChange={(e) => setImpactedWaterbody(e.target.value)}
              placeholder="—"
            />
          </div>
          <div>
            <Label htmlFor="cause">Cause</Label>
            <Textarea
              id="cause"
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              placeholder="Describe the cause of the incident"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="immediateActions">Immediate actions taken</Label>
            <Textarea
              id="immediateActions"
              value={immediateActions}
              onChange={(e) => setImmediateActions(e.target.value)}
              placeholder="Describe immediate response actions"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : initial ? "Update" : "Create"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
