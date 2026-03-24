"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContainmentType, ConditionStatus } from "@/generated/prisma/enums";

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  containmentType: z.nativeEnum(ContainmentType),
  largestSingleTankCapacityGallons: z.coerce.number().min(0).optional(),
  capacityCalculationMethod: z.string().optional(),
  calculatedCapacityGallons: z.coerce.number().min(0).optional(),
  drainageControlNotes: z.string().optional(),
  conditionStatus: z.nativeEnum(ConditionStatus).optional(),
  lastInspectionDate: z.string().optional(),
  comments: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  facilityId: string;
  unitId?: string;
  initial?: Partial<FormData>;
};

const CONTAINMENT_TYPES = Object.entries(ContainmentType).map(([k, v]) => ({
  value: v,
  label: k.replace(/_/g, " "),
}));
const CONDITION_STATUSES = Object.entries(ConditionStatus).map(([k, v]) => ({
  value: v,
  label: k.replace(/_/g, " "),
}));

export function ContainmentForm({
  facilityId,
  unitId,
  initial,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      containmentType: initial?.containmentType ?? "DIKE_BERM",
      largestSingleTankCapacityGallons: initial?.largestSingleTankCapacityGallons ?? undefined,
      capacityCalculationMethod: initial?.capacityCalculationMethod ?? "",
      calculatedCapacityGallons: initial?.calculatedCapacityGallons ?? undefined,
      drainageControlNotes: initial?.drainageControlNotes ?? "",
      conditionStatus: initial?.conditionStatus ?? undefined,
      lastInspectionDate: initial?.lastInspectionDate?.slice(0, 10) ?? "",
      comments: initial?.comments ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    setError("");
    setSaving(true);
    try {
      const url = unitId
        ? `/api/facilities/${facilityId}/containment/${unitId}`
        : `/api/facilities/${facilityId}/containment`;
      const res = await fetch(url, {
        method: unitId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setError("Failed to save");
        return;
      }
      const result = await res.json();
      router.push(
        unitId
          ? `/app/facilities/${facilityId}/containment/${unitId}`
          : `/app/facilities/${facilityId}/containment/${result.unitId}`
      );
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
          <CardTitle>Basic details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input {...form.register("code")} />
              {form.formState.errors.code && (
                <p className="text-xs text-red-600">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Containment type</Label>
            <Select
              value={form.watch("containmentType")}
              onValueChange={(v) => form.setValue("containmentType", v as ContainmentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTAINMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Capacity & drainage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Largest single tank capacity (gallons)</Label>
            <Input
              type="number"
              min={0}
              {...form.register("largestSingleTankCapacityGallons")}
            />
          </div>
          <div className="space-y-2">
            <Label>Capacity calculation method</Label>
            <Textarea
              {...form.register("capacityCalculationMethod")}
              rows={2}
              placeholder="Basis for calculated capacity"
            />
          </div>
          <div className="space-y-2">
            <Label>Calculated capacity (gallons)</Label>
            <Input type="number" min={0} {...form.register("calculatedCapacityGallons")} />
          </div>
          <div className="space-y-2">
            <Label>Drainage control notes</Label>
            <Textarea {...form.register("drainageControlNotes")} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Condition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Condition status</Label>
            <Select
              value={form.watch("conditionStatus") ?? ""}
              onValueChange={(v) =>
                form.setValue("conditionStatus", v ? (v as ConditionStatus) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_STATUSES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Last inspection date</Label>
            <Input type="date" {...form.register("lastInspectionDate")} />
          </div>
          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea {...form.register("comments")} rows={4} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : unitId ? "Update" : "Create"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
