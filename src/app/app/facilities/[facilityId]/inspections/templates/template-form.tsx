"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetClass, InspectionType } from "@/generated/prisma/enums";
import { GripVertical, Plus, Trash2 } from "lucide-react";

const RESPONSE_TYPES = [
  { value: "boolean", label: "Yes/No" },
  { value: "number", label: "Number" },
  { value: "text", label: "Text" },
  { value: "single_select", label: "Single select" },
  { value: "multi_select", label: "Multi select" },
  { value: "photo_required", label: "Photo required" },
  { value: "signature_required", label: "Signature required" },
];

const FAILURE_SEVERITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const itemSchema = z.object({
  prompt: z.string().min(1, "Prompt required"),
  responseType: z.string().min(1),
  required: z.boolean(),
  acceptableRange: z.string().optional(),
  failureSeverity: z.string().optional(),
  regulatoryRequirementId: z.string().optional(),
  autoCreateCorrectiveAction: z.boolean(),
});

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  assetClass: z.nativeEnum(AssetClass),
  inspectionType: z.nativeEnum(InspectionType),
  facilitySpecific: z.boolean(),
  standardBasisRef: z.string().optional(),
  procedureText: z.string().optional(),
  expectedFrequencyDays: z.coerce.number().min(0).optional(),
  performerQualificationBasis: z.string().optional(),
  items: z.array(itemSchema),
});

type FormData = z.infer<typeof schema>;
type ItemData = z.infer<typeof itemSchema>;

type RegulatoryRequirement = {
  id: string;
  requirementCode: string;
  title: string;
  sourceType: string;
};

type Props = {
  facilityId: string;
  templateId?: string;
  initial?: Partial<FormData> & {
    items?: Array<Partial<ItemData>>;
  };
};

export function InspectionTemplateForm({
  facilityId,
  templateId,
  initial,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [requirements, setRequirements] = useState<RegulatoryRequirement[]>([]);

  useEffect(() => {
    fetch(`/api/facilities/${facilityId}/regulatory-requirements`)
      .then((r) => r.json())
      .then((d) => setRequirements(d.requirements ?? []))
      .catch(() => {});
  }, [facilityId]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: initial?.name ?? "",
      assetClass: initial?.assetClass ?? "BULK_STORAGE_CONTAINER",
      inspectionType: initial?.inspectionType ?? "VISUAL",
      facilitySpecific: initial?.facilitySpecific ?? false,
      standardBasisRef: initial?.standardBasisRef ?? "",
      procedureText: initial?.procedureText ?? "",
      expectedFrequencyDays: initial?.expectedFrequencyDays ?? undefined,
      performerQualificationBasis: initial?.performerQualificationBasis ?? "",
      items: initial?.items?.length
        ? initial.items.map((i) => ({
            prompt: i.prompt ?? "",
            responseType: i.responseType ?? "boolean",
            required: i.required ?? false,
            acceptableRange: i.acceptableRange ?? "",
            failureSeverity: i.failureSeverity ?? "",
            regulatoryRequirementId: i.regulatoryRequirementId ?? "",
            autoCreateCorrectiveAction: i.autoCreateCorrectiveAction ?? false,
          }))
        : [
            {
              prompt: "",
              responseType: "boolean",
              required: false,
              acceptableRange: "",
              failureSeverity: "",
              regulatoryRequirementId: "",
              autoCreateCorrectiveAction: false,
            },
          ],
    },
  });

  const items = form.watch("items");

  function addItem() {
    form.setValue("items", [
      ...items,
      {
        prompt: "",
        responseType: "boolean",
        required: false,
        acceptableRange: "",
        failureSeverity: "",
        regulatoryRequirementId: "",
        autoCreateCorrectiveAction: false,
      },
    ]);
  }

  function removeItem(idx: number) {
    form.setValue(
      "items",
      items.filter((_, i) => i !== idx)
    );
  }

  async function onSubmit(data: FormData) {
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        assetClass: data.assetClass,
        inspectionType: data.inspectionType,
        facilitySpecific: data.facilitySpecific,
        standardBasisRef: data.standardBasisRef || undefined,
        procedureText: data.procedureText || undefined,
        expectedFrequencyDays: data.expectedFrequencyDays ?? undefined,
        performerQualificationBasis: data.performerQualificationBasis || undefined,
        items: data.items
          .filter((i) => i.prompt.trim())
          .map((i) => ({
            prompt: i.prompt.trim(),
            responseType: i.responseType,
            required: i.required,
            acceptableRange: i.acceptableRange?.trim() || null,
            failureSeverity: i.failureSeverity || null,
            regulatoryRequirementId: i.regulatoryRequirementId || null,
            autoCreateCorrectiveAction: i.autoCreateCorrectiveAction,
          })),
      };

      const url = templateId
        ? `/api/facilities/${facilityId}/inspection-templates/${templateId}`
        : `/api/facilities/${facilityId}/inspection-templates`;
      const res = await fetch(url, {
        method: templateId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Failed to save");
        return;
      }
      const result = await res.json();
      router.push(`/app/facilities/${facilityId}/inspections`);
      router.refresh();
    } catch {
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Template metadata</CardTitle>
          <p className="text-sm text-[var(--muted)]">
            Asset class and inspection type determine when this template applies
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="e.g. Monthly visual inspection" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-8">
              <Checkbox
                id="facilitySpecific"
                checked={form.watch("facilitySpecific")}
                onCheckedChange={(v) => form.setValue("facilitySpecific", !!v)}
              />
              <Label htmlFor="facilitySpecific">Facility-specific (not shared across org)</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Asset class</Label>
              <Select
                value={form.watch("assetClass")}
                onValueChange={(v) => form.setValue("assetClass", v as AssetClass)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AssetClass).map(([k, v]) => (
                    <SelectItem key={v} value={v}>
                      {k.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Inspection type</Label>
              <Select
                value={form.watch("inspectionType")}
                onValueChange={(v) => form.setValue("inspectionType", v as InspectionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(InspectionType).map(([k, v]) => (
                    <SelectItem key={v} value={v}>
                      {k.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Standard basis / citation</Label>
            <Input
              {...form.register("standardBasisRef")}
              placeholder="e.g. 40 CFR 112.7(e)(2)"
            />
          </div>
          <div className="space-y-2">
            <Label>Procedure text</Label>
            <Textarea
              {...form.register("procedureText")}
              rows={3}
              placeholder="Describe the inspection procedure..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expected frequency (days)</Label>
              <Input
                type="number"
                min={0}
                {...form.register("expectedFrequencyDays")}
              />
            </div>
            <div className="space-y-2">
              <Label>Performer qualification basis</Label>
              <Input
                {...form.register("performerQualificationBasis")}
                placeholder="e.g. Trained inspector"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Checklist items</CardTitle>
            <p className="text-sm text-[var(--muted)] mt-1">
              Each item defines a prompt and response type; failed items can auto-create corrective actions
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((_, idx) => (
            <div
              key={idx}
              className="border border-[var(--border)] rounded-lg p-4 space-y-3 bg-[var(--mist-gray)]/30"
            >
              <div className="flex items-start gap-2">
                <GripVertical className="h-5 w-5 text-[var(--muted)] mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Prompt</Label>
                      <Input
                        {...form.register(`items.${idx}.prompt`)}
                        placeholder="e.g. Is the container free of visible corrosion?"
                      />
                    </div>
                    <div className="w-36">
                      <Label className="text-xs">Response type</Label>
                      <Select
                        value={form.watch(`items.${idx}.responseType`)}
                        onValueChange={(v) => form.setValue(`items.${idx}.responseType`, v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RESPONSE_TYPES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(idx)}
                      className="mt-6 shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`required-${idx}`}
                        checked={form.watch(`items.${idx}.required`)}
                        onCheckedChange={(v) => form.setValue(`items.${idx}.required`, !!v)}
                      />
                      <Label htmlFor={`required-${idx}`} className="text-xs">Required</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`autoCA-${idx}`}
                        checked={form.watch(`items.${idx}.autoCreateCorrectiveAction`)}
                        onCheckedChange={(v) =>
                          form.setValue(`items.${idx}.autoCreateCorrectiveAction`, !!v)
                        }
                      />
                      <Label htmlFor={`autoCA-${idx}`} className="text-xs">
                        Auto-create corrective action on fail
                      </Label>
                    </div>
                    <div className="w-28">
                      <Label className="text-xs">Failure severity</Label>
                      <Select
                        value={form.watch(`items.${idx}.failureSeverity`) ?? ""}
                        onValueChange={(v) => form.setValue(`items.${idx}.failureSeverity`, v || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {FAILURE_SEVERITIES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {requirements.length > 0 && (
                      <div className="w-48">
                        <Label className="text-xs">Regulatory requirement</Label>
                        <Select
                          value={form.watch(`items.${idx}.regulatoryRequirementId`) ?? ""}
                          onValueChange={(v) =>
                            form.setValue(`items.${idx}.regulatoryRequirementId`, v || undefined)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {requirements.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.requirementCode} – {r.title.slice(0, 30)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="w-32">
                      <Label className="text-xs">Acceptable range (JSON)</Label>
                      <Input
                        {...form.register(`items.${idx}.acceptableRange`)}
                        placeholder='e.g. {"min":0,"max":100}'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : templateId ? "Update template" : "Create template"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
