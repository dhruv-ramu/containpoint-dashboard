"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  templateId: z.string().min(1, "Select a template"),
  assetId: z.string().optional(),
  dueDate: z.string().min(1, "Due date required"),
});

type FormData = z.infer<typeof schema>;

type Template = { id: string; name: string; assetClass: string };
type Asset = { id: string; name: string; assetCode: string };

export default function ScheduleNewPage() {
  const router = useRouter();
  const params = useParams();
  const facilityId = params.facilityId as string;
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/facilities/${facilityId}/inspection-templates`).then((r) => r.json()),
      fetch(`/api/facilities/${facilityId}/assets`).then((r) => r.json()),
    ]).then(([tRes, aRes]) => {
      setTemplates(tRes.templates ?? []);
      setAssets(aRes.assets ?? []);
    }).catch(() => {});
  }, [facilityId]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      templateId: "",
      assetId: "",
      dueDate: new Date().toISOString().slice(0, 10),
    },
  });

  async function onSubmit(data: FormData) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/scheduled-inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: data.templateId,
          assetId: data.assetId || undefined,
          dueDate: data.dueDate,
        }),
      });
      if (!res.ok) {
        setError("Failed to schedule");
        return;
      }
      router.push(`/app/facilities/${facilityId}/inspections`);
      router.refresh();
    } catch {
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Schedule inspection
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Create a scheduled inspection from a template
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={form.watch("templateId")}
                onValueChange={(v) => form.setValue("templateId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.assetClass.replace(/_/g, " ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.templateId && (
                <p className="text-xs text-red-600">{form.formState.errors.templateId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Asset (optional)</Label>
              <Select
                value={form.watch("assetId") ?? ""}
                onValueChange={(v) => form.setValue("assetId", v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.assetCode} – {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" {...form.register("dueDate")} />
              {form.formState.errors.dueDate && (
                <p className="text-xs text-red-600">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Scheduling..." : "Schedule"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
