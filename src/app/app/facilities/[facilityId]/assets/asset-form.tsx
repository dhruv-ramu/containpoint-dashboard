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
import { Checkbox } from "@/components/ui/checkbox";
import { AssetType, AssetClass, AssetModeState } from "@/generated/prisma/enums";

const schema = z.object({
  assetCode: z.string().min(1, "Asset code is required"),
  name: z.string().min(1, "Name is required"),
  assetType: z.nativeEnum(AssetType),
  oilTypeId: z.string().optional(),
  storageCapacityGallons: z.coerce.number().min(0).optional(),
  typicalFillPercent: z.coerce.number().min(0).max(100).optional(),
  countedTowardThreshold: z.boolean(),
  exclusionReason: z.string().optional(),
  aboveground: z.boolean(),
  indoor: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "RETIRED"]),
  installDate: z.string().optional(),
  retirementDate: z.string().optional(),
  manufacturer: z.string().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  overfillProtectionNotes: z.string().optional(),
  integrityTestingBasis: z.string().optional(),
  inspectionFrequencyDays: z.coerce.number().min(0).optional(),
  comments: z.string().optional(),
  containmentUnitIds: z.array(z.string()).optional(),
  assetClass: z.nativeEnum(AssetClass).optional(),
  modeState: z.nativeEnum(AssetModeState).optional(),
  requiresSizedContainment: z.boolean().optional(),
  underDirectControl: z.boolean().optional(),
  containmentValidationBasis: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type OilType = { id: string; label: string };
type ContainmentUnit = { id: string; code: string; name: string };

type Props = {
  facilityId: string;
  assetId?: string;
  oilTypes: OilType[];
  containmentUnits: ContainmentUnit[];
  initial?: Partial<FormData> & {
    containmentLinks?: { containmentUnitId: string }[];
  };
};

const ASSET_TYPES = Object.entries(AssetType).map(([k, v]) => ({ value: v, label: k.replace(/_/g, " ") }));

export function AssetForm({
  facilityId,
  assetId,
  oilTypes,
  containmentUnits,
  initial,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      assetCode: initial?.assetCode ?? "",
      name: initial?.name ?? "",
      assetType: initial?.assetType ?? "BULK_STORAGE_CONTAINER",
      oilTypeId: initial?.oilTypeId ?? "",
      storageCapacityGallons: initial?.storageCapacityGallons ?? undefined,
      typicalFillPercent: initial?.typicalFillPercent ?? undefined,
      countedTowardThreshold: initial?.countedTowardThreshold ?? true,
      exclusionReason: initial?.exclusionReason ?? "",
      aboveground: initial?.aboveground ?? true,
      indoor: initial?.indoor ?? undefined,
      status: initial?.status ?? "ACTIVE",
      installDate: initial?.installDate?.slice(0, 10) ?? "",
      retirementDate: initial?.retirementDate?.slice(0, 10) ?? "",
      manufacturer: initial?.manufacturer ?? "",
      material: initial?.material ?? "",
      dimensions: initial?.dimensions ?? "",
      overfillProtectionNotes: initial?.overfillProtectionNotes ?? "",
      integrityTestingBasis: initial?.integrityTestingBasis ?? "",
      inspectionFrequencyDays: initial?.inspectionFrequencyDays ?? undefined,
      comments: initial?.comments ?? "",
      assetClass: initial?.assetClass ?? undefined,
      modeState: initial?.modeState ?? undefined,
      requiresSizedContainment: initial?.requiresSizedContainment ?? false,
      underDirectControl: initial?.underDirectControl ?? undefined,
      containmentValidationBasis: initial?.containmentValidationBasis ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    setError("");
    setSaving(true);
    try {
      const url = assetId
        ? `/api/facilities/${facilityId}/assets/${assetId}`
        : `/api/facilities/${facilityId}/assets`;
      const res = await fetch(url, {
        method: assetId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setError("Failed to save");
        return;
      }
      const result = await res.json();
      router.push(`/app/facilities/${facilityId}/assets/${result.assetId ?? assetId}`);
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
              <Label>Asset code</Label>
              <Input {...form.register("assetCode")} />
              {form.formState.errors.assetCode && (
                <p className="text-xs text-red-600">{form.formState.errors.assetCode.message}</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Asset class (Phase 2)</Label>
              <Select
                value={form.watch("assetClass") ?? ""}
                onValueChange={(v) => form.setValue("assetClass", v ? (v as AssetClass) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
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
            {form.watch("assetClass") === "MOBILE_PORTABLE_CONTAINER" && (
              <div className="space-y-2">
                <Label>Mode state</Label>
                <Select
                  value={form.watch("modeState") ?? ""}
                  onValueChange={(v) => form.setValue("modeState", v ? (v as AssetModeState) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AssetModeState).map(([k, v]) => (
                      <SelectItem key={v} value={v}>
                        {k.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Asset type</Label>
              <Select
                value={form.watch("assetType")}
                onValueChange={(v) => form.setValue("assetType", v as AssetType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Oil type</Label>
              <Select
                value={form.watch("oilTypeId") ?? ""}
                onValueChange={(v) => form.setValue("oilTypeId", v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {oilTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Storage capacity (gallons)</Label>
              <Input type="number" min={0} {...form.register("storageCapacityGallons")} />
            </div>
            <div className="space-y-2">
              <Label>Typical fill %</Label>
              <Input type="number" min={0} max={100} {...form.register("typicalFillPercent")} />
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox
                id="requiresSizedContainment"
                checked={form.watch("requiresSizedContainment")}
                onCheckedChange={(v) => form.setValue("requiresSizedContainment", !!v)}
              />
              <Label htmlFor="requiresSizedContainment">Requires sized containment</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="underDirectControl"
                checked={form.watch("underDirectControl")}
                onCheckedChange={(v) => form.setValue("underDirectControl", v === true)}
              />
              <Label htmlFor="underDirectControl">Under direct control</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="counted"
                checked={form.watch("countedTowardThreshold")}
                onCheckedChange={(v) => form.setValue("countedTowardThreshold", !!v)}
              />
              <Label htmlFor="counted">Counted toward threshold</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="aboveground"
                checked={form.watch("aboveground")}
                onCheckedChange={(v) => form.setValue("aboveground", !!v)}
              />
              <Label htmlFor="aboveground">Aboveground</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="indoor"
                checked={form.watch("indoor")}
                onCheckedChange={(v) => form.setValue("indoor", v === true)}
              />
              <Label htmlFor="indoor">Indoor</Label>
            </div>
          </div>
          {!form.watch("countedTowardThreshold") && (
            <div className="space-y-2">
              <Label>Exclusion reason</Label>
              <Textarea {...form.register("exclusionReason")} rows={2} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Status & dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as "ACTIVE" | "INACTIVE" | "RETIRED")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Install date</Label>
              <Input type="date" {...form.register("installDate")} />
            </div>
            <div className="space-y-2">
              <Label>Retirement date</Label>
              <Input type="date" {...form.register("retirementDate")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input {...form.register("manufacturer")} />
            </div>
            <div className="space-y-2">
              <Label>Material</Label>
              <Input {...form.register("material")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dimensions</Label>
            <Input {...form.register("dimensions")} placeholder="e.g. 10ft x 8ft x 6ft" />
          </div>
          <div className="space-y-2">
            <Label>Overfill protection notes</Label>
            <Textarea {...form.register("overfillProtectionNotes")} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Integrity testing basis</Label>
            <Textarea {...form.register("integrityTestingBasis")} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Inspection frequency (days)</Label>
            <Input type="number" min={0} {...form.register("inspectionFrequencyDays")} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Containment & comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Containment validation basis</Label>
            <Textarea
              {...form.register("containmentValidationBasis")}
              rows={2}
              placeholder="Basis for containment validation, if applicable"
            />
          </div>
          {containmentUnits.length > 0 && (
            <div className="space-y-2">
              <Label>Linked containment</Label>
              <p className="text-sm text-[var(--muted)]">
                Containment linking can be edited in asset details.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea {...form.register("comments")} rows={4} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : assetId ? "Update asset" : "Create asset"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
