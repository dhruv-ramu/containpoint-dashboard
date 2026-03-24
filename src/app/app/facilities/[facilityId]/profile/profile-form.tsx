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

const schema = z.object({
  legalName: z.string().optional(),
  dbaName: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  naicsCode: z.string().optional(),
  industry: z.string().optional(),
  dischargeExpectationNarrative: z.string().optional(),
  nearestWaterbody: z.string().optional(),
  operatingHours: z.string().optional(),
  consultantOfRecord: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  currentPlanEffectiveDate: z.string().optional(),
  nextFiveYearReviewDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  facilityId: string;
  initial: {
    legalName?: string | null;
    dbaName?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    naicsCode?: string | null;
    industry?: string | null;
    dischargeExpectationNarrative?: string | null;
    nearestWaterbody?: string | null;
    operatingHours?: string | null;
    consultantOfRecord?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    currentPlanEffectiveDate?: Date | null;
    nextFiveYearReviewDate?: Date | null;
  } | null;
};

export function FacilityProfileForm({ facilityId, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      legalName: initial?.legalName ?? "",
      dbaName: initial?.dbaName ?? "",
      addressLine1: initial?.addressLine1 ?? "",
      addressLine2: initial?.addressLine2 ?? "",
      city: initial?.city ?? "",
      state: initial?.state ?? "",
      postalCode: initial?.postalCode ?? "",
      country: initial?.country ?? "US",
      naicsCode: initial?.naicsCode ?? "",
      industry: initial?.industry ?? "",
      dischargeExpectationNarrative: initial?.dischargeExpectationNarrative ?? "",
      nearestWaterbody: initial?.nearestWaterbody ?? "",
      operatingHours: initial?.operatingHours ?? "",
      consultantOfRecord: initial?.consultantOfRecord ?? "",
      emergencyContactName: initial?.emergencyContactName ?? "",
      emergencyContactPhone: initial?.emergencyContactPhone ?? "",
      currentPlanEffectiveDate: initial?.currentPlanEffectiveDate
        ? new Date(initial.currentPlanEffectiveDate).toISOString().slice(0, 10)
        : "",
      nextFiveYearReviewDate: initial?.nextFiveYearReviewDate
        ? new Date(initial.nextFiveYearReviewDate).toISOString().slice(0, 10)
        : "",
    },
  });

  async function onSubmit(data: FormData) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          currentPlanEffectiveDate: data.currentPlanEffectiveDate || null,
          nextFiveYearReviewDate: data.nextFiveYearReviewDate || null,
        }),
      });
      if (!res.ok) {
        setError("Failed to save");
        return;
      }
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
          <CardTitle>Legal & address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Legal name</Label>
              <Input {...form.register("legalName")} />
            </div>
            <div className="space-y-2">
              <Label>DBA name</Label>
              <Input {...form.register("dbaName")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address line 1</Label>
            <Input {...form.register("addressLine1")} />
          </div>
          <div className="space-y-2">
            <Label>Address line 2</Label>
            <Input {...form.register("addressLine2")} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...form.register("city")} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input {...form.register("state")} />
            </div>
            <div className="space-y-2">
              <Label>Postal code</Label>
              <Input {...form.register("postalCode")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input {...form.register("country")} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Site details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NAICS code</Label>
              <Input {...form.register("naicsCode")} />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input {...form.register("industry")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Operating hours</Label>
            <Input {...form.register("operatingHours")} placeholder="e.g. 24/7, Mon-Fri 8-5" />
          </div>
          <div className="space-y-2">
            <Label>Discharge expectation narrative</Label>
            <Textarea {...form.register("dischargeExpectationNarrative")} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Nearest waterbody</Label>
            <Input {...form.register("nearestWaterbody")} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Contacts & dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Consultant of record</Label>
            <Input {...form.register("consultantOfRecord")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emergency contact name</Label>
              <Input {...form.register("emergencyContactName")} />
            </div>
            <div className="space-y-2">
              <Label>Emergency contact phone</Label>
              <Input {...form.register("emergencyContactPhone")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current plan effective date</Label>
              <Input type="date" {...form.register("currentPlanEffectiveDate")} />
            </div>
            <div className="space-y-2">
              <Label>Next 5-year review date</Label>
              <Input type="date" {...form.register("nextFiveYearReviewDate")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
