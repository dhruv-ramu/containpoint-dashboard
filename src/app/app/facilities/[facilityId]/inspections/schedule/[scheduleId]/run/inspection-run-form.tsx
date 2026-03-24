"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TemplateItem = {
  id: string;
  prompt: string;
  responseType: string;
  required: boolean;
  failureSeverity: string | null;
  autoCreateCorrectiveAction: boolean;
};

type Template = {
  id: string;
  name: string;
  standardBasisRef: string | null;
  procedureText: string | null;
};

type Asset = { id: string; name: string } | null;

type Props = {
  facilityId: string;
  scheduleId: string;
  items: TemplateItem[];
  template: Template;
  asset: Asset;
  performer: {
    userId: string;
    name: string;
    role: string;
    qualificationBasis?: string;
  };
};

type ItemState = {
  templateItemId: string;
  responseValue: unknown;
  pass: boolean | null;
  notes: string;
};

export function InspectionRunForm({
  facilityId,
  scheduleId,
  items,
  template,
  performer,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"checklist" | "sign">("checklist");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [itemStates, setItemStates] = useState<ItemState[]>(
    items.map((i) => ({
      templateItemId: i.id,
      responseValue: null,
      pass: null,
      notes: "",
    }))
  );
  const [signerName, setSignerName] = useState(performer.name);
  const [certify, setCertify] = useState(false);

  function setItemValue(idx: number, field: keyof ItemState, value: unknown) {
    setItemStates((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  const allRequiredAnswered = items.every((it, i) => {
    if (!it.required) return true;
    const s = itemStates[i];
    if (s.pass === null) return false;
    if (it.responseType === "boolean" && s.responseValue === null) return false;
    if (it.responseType === "text" && !String(s.responseValue).trim()) return false;
    if (it.responseType === "number" && s.responseValue == null) return false;
    return true;
  });

  async function submit(signAndLock: boolean) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/inspection-runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledInspectionId: scheduleId,
          performedByNameSnapshot: performer.name,
          performedByRoleSnapshot: performer.role,
          qualificationBasis: performer.qualificationBasis,
          standardBasisRef: template.standardBasisRef,
          procedureTextSnapshot: template.procedureText,
          itemResults: itemStates.map((s) => ({
            templateItemId: s.templateItemId,
            responseValue: s.responseValue,
            pass: s.pass,
            notes: s.notes || undefined,
          })),
          signAndLock,
          signerName: signAndLock ? signerName : undefined,
          signerRole: signAndLock ? performer.role : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Failed to save");
        return;
      }

      const data = await res.json();
      if (data.locked) {
        router.push(`/app/facilities/${facilityId}/inspections`);
        router.refresh();
      } else {
        setStep("sign");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleSign() {
    if (!certify) {
      setError("You must certify the inspection to sign.");
      return;
    }
    await submit(true);
  }

  if (step === "sign") {
    return (
      <Card>
        <CardContent className="pt-5">
          <h2 className="font-medium mb-4">Sign and lock inspection</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            By signing, you certify that this inspection was performed as documented.
            The record will become immutable.
          </p>
          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}
          <div className="space-y-4 max-w-sm">
            <div>
              <Label>Your name</Label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="certify"
                checked={certify}
                onCheckedChange={(v) => setCertify(!!v)}
              />
              <Label htmlFor="certify" className="text-sm">
                I certify that I performed this inspection in accordance with the
                procedure and that the recorded results are accurate.
              </Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSign} disabled={saving || !certify}>
                {saving ? "Signing..." : "Sign and lock"}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (allRequiredAnswered) submit(false);
      }}
    >
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Card className="mb-6">
        <CardContent className="pt-5">
          <h3 className="font-medium mb-1">Performer</h3>
          <p className="text-sm text-[var(--muted)]">
            {performer.name} · {performer.role}
            {performer.qualificationBasis && ` · ${performer.qualificationBasis}`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-6">
          <h2 className="font-medium">Checklist</h2>
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="border-b border-[var(--border)] pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <Label className="font-medium">
                    {idx + 1}. {item.prompt}
                    {item.required && " *"}
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {item.responseType === "boolean" && (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`pass-${item.id}`}
                            checked={itemStates[idx].pass === true}
                            onChange={() => {
                              setItemValue(idx, "pass", true);
                              setItemValue(idx, "responseValue", true);
                            }}
                          />
                          Pass
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`pass-${item.id}`}
                            checked={itemStates[idx].pass === false}
                            onChange={() => {
                              setItemValue(idx, "pass", false);
                              setItemValue(idx, "responseValue", false);
                            }}
                          />
                          Fail
                        </label>
                      </>
                    )}
                    {item.responseType === "number" && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={itemStates[idx].responseValue as number ?? ""}
                          onChange={(e) => {
                            const v = e.target.value ? Number(e.target.value) : null;
                            setItemValue(idx, "responseValue", v);
                            setItemValue(idx, "pass", v != null ? true : null);
                          }}
                          className="w-24"
                        />
                        <Select
                          value={itemStates[idx].pass === null ? "" : itemStates[idx].pass ? "pass" : "fail"}
                          onValueChange={(v) => setItemValue(idx, "pass", v === "pass")}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue placeholder="Pass/Fail" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="fail">Fail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {item.responseType === "text" && (
                      <div className="w-full space-y-2">
                        <Input
                          value={(itemStates[idx].responseValue as string) ?? ""}
                          onChange={(e) => {
                            setItemValue(idx, "responseValue", e.target.value);
                            setItemValue(idx, "pass", e.target.value.trim() ? true : null);
                          }}
                          placeholder="Enter response"
                        />
                        <Select
                          value={itemStates[idx].pass === null ? "" : itemStates[idx].pass ? "pass" : "fail"}
                          onValueChange={(v) => setItemValue(idx, "pass", v === "pass")}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue placeholder="Pass/Fail" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="fail">Fail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {["single_select", "multi_select", "photo_required", "signature_required"].includes(
                      item.responseType
                    ) && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={itemStates[idx].pass === null ? "" : itemStates[idx].pass ? "pass" : "fail"}
                          onValueChange={(v) => {
                            setItemValue(idx, "pass", v === "pass");
                            setItemValue(idx, "responseValue", v);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Pass/Fail" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="fail">Fail</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-[var(--muted)]">
                          ({item.responseType.replace(/_/g, " ")})
                        </span>
                      </div>
                    )}
                  </div>
                  {itemStates[idx].pass === false && (
                    <div className="mt-2">
                      <Label className="text-xs">Notes (required for failures)</Label>
                      <Textarea
                        value={itemStates[idx].notes}
                        onChange={(e) => setItemValue(idx, "notes", e.target.value)}
                        rows={2}
                        placeholder="Describe the finding..."
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-2">
        <Button type="submit" disabled={saving || !allRequiredAnswered}>
          {saving ? "Saving..." : "Submit and sign"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
