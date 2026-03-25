"use client";

import { useState } from "react";
import Link from "next/link";
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
import { determineQualification } from "@/lib/qualification";
import { Check, Circle } from "lucide-react";

const STEPS = [
  "Facility basics",
  "Applicability",
  "Qualification",
  "Accountable person",
  "Summary",
];

const step1Schema = z.object({
  name: z.string().min(1),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  industry: z.string().optional(),
  operatingHours: z.string().optional(),
});

const step2Schema = z.object({
  nonTransportationRelated: z.boolean(),
  aggregateAbovegroundCapacityGallons: z.coerce.number().min(0),
  completelyBuriedCapacityGallons: z.coerce.number().min(0),
  hasReasonableExpectationOfDischarge: z.boolean(),
  hasContainersBelow55Excluded: z.boolean(),
  hasPermanentlyClosedContainersExcluded: z.boolean(),
  hasMotivePowerContainersExcluded: z.boolean(),
  hasWastewaterTreatmentExclusions: z.boolean(),
  notes: z.string().optional(),
});

const step3Schema = z.object({
  maxIndividualContainerGallons: z.coerce.number().min(0).optional(),
  singleDischargeGt1000Last3Years: z.boolean(),
  twoDischargesGt42Within12MonthsLast3Years: z.boolean(),
});

const step4Schema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

type WizardState = {
  step1?: Step1Data;
  step2?: Step2Data & { spccApplicable?: boolean };
  step3?: Step3Data & {
    qualifiedFacility?: boolean;
    tier?: string;
    v1Fit?: string;
    rationale?: string;
  };
  step4?: Step4Data;
};

type Props = {
  facilityId: string;
  facilityName: string;
  initialProfile: {
    legalName?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    industry?: string | null;
    operatingHours?: string | null;
  } | null;
  initialAccountable: {
    name: string;
    title?: string | null;
    email: string;
    phone?: string | null;
  } | null;
  initialApplicability: {
    nonTransportationRelated: boolean;
    aggregateAbovegroundCapacityGallons: number;
    completelyBuriedCapacityGallons: number;
    hasReasonableExpectationOfDischarge: boolean;
    hasContainersBelow55Excluded: boolean;
    hasPermanentlyClosedContainersExcluded: boolean;
    hasMotivePowerContainersExcluded: boolean;
    hasWastewaterTreatmentExclusions: boolean;
    spccApplicable: boolean;
  } | null;
  initialQualification: {
    qualifiedFacility: boolean;
    tier: string;
    maxIndividualContainerGallons?: number | null;
    singleDischargeGt1000Last3Years: boolean;
    twoDischargesGt42Within12MonthsLast3Years: boolean;
  } | null;
  userId: string;
  completionHints: { assetCount: number };
};

export function SetupWizard(props: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [state, setState] = useState<WizardState>(() => ({
    step1: props.initialProfile
      ? {
          name: props.facilityName,
          addressLine1: props.initialProfile.addressLine1 ?? "",
          addressLine2: props.initialProfile.addressLine2 ?? "",
          city: props.initialProfile.city ?? "",
          state: props.initialProfile.state ?? "",
          postalCode: props.initialProfile.postalCode ?? "",
          industry: props.initialProfile.industry ?? "",
          operatingHours: props.initialProfile.operatingHours ?? "",
        }
      : { name: props.facilityName },
    step2: props.initialApplicability
      ? {
          ...props.initialApplicability,
          completelyBuriedCapacityGallons: props.initialApplicability.completelyBuriedCapacityGallons,
        }
      : {
          nonTransportationRelated: true,
          aggregateAbovegroundCapacityGallons: 0,
          completelyBuriedCapacityGallons: 0,
          hasReasonableExpectationOfDischarge: true,
          hasContainersBelow55Excluded: false,
          hasPermanentlyClosedContainersExcluded: false,
          hasMotivePowerContainersExcluded: false,
          hasWastewaterTreatmentExclusions: false,
        },
    step3: props.initialQualification
      ? {
          maxIndividualContainerGallons: props.initialQualification.maxIndividualContainerGallons ?? undefined,
          singleDischargeGt1000Last3Years: props.initialQualification.singleDischargeGt1000Last3Years,
          twoDischargesGt42Within12MonthsLast3Years:
            props.initialQualification.twoDischargesGt42Within12MonthsLast3Years,
        }
      : {
          singleDischargeGt1000Last3Years: false,
          twoDischargesGt42Within12MonthsLast3Years: false,
        },
    step4: props.initialAccountable
      ? {
          name: props.initialAccountable.name,
          title: props.initialAccountable.title ?? "",
          email: props.initialAccountable.email,
          phone: props.initialAccountable.phone ?? "",
        }
      : undefined,
  }));

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema) as any,
    defaultValues: state.step1 ?? { name: props.facilityName },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema) as any,
    defaultValues: state.step2 ?? {
      nonTransportationRelated: true,
      aggregateAbovegroundCapacityGallons: 0,
      completelyBuriedCapacityGallons: 0,
      hasReasonableExpectationOfDischarge: true,
      hasContainersBelow55Excluded: false,
      hasPermanentlyClosedContainersExcluded: false,
      hasMotivePowerContainersExcluded: false,
      hasWastewaterTreatmentExclusions: false,
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema) as any,
    defaultValues: state.step3 ?? {
      singleDischargeGt1000Last3Years: false,
      twoDischargesGt42Within12MonthsLast3Years: false,
    },
  });

  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema) as any,
    defaultValues: state.step4 ?? {},
  });

  async function saveAndNext(
    data: Step1Data | Step2Data | Step3Data | Step4Data,
    currentStep: number
  ) {
    setError("");
    try {
      const res = await fetch(`/api/facilities/${props.facilityId}/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: currentStep, data }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to save");
        return;
      }
      const result = await res.json();
      setState((s) => ({ ...s, [`step${currentStep}`]: { ...data, ...result } }));
      setStep((s) => Math.min(s + 1, 5));
    } catch {
      setError("An error occurred");
    }
  }

  function handleStep1Submit(data: Step1Data) {
    saveAndNext(data, 1);
  }

  function handleStep2Submit(data: Step2Data) {
    saveAndNext(data, 2);
  }

  function handleStep3Submit(data: Step3Data) {
    saveAndNext(data, 3);
  }

  function handleStep4Submit(data: Step4Data) {
    saveAndNext(data, 4);
  }

  async function handleComplete() {
    setError("");
    try {
      const res = await fetch(`/api/facilities/${props.facilityId}/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 5, complete: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to complete");
        return;
      }
      router.push(`/app/facilities/${props.facilityId}`);
      router.refresh();
    } catch {
      setError("An error occurred");
    }
  }

  const computed =
    state.step2 && state.step3
      ? (() => {
          const a = state.step2 as Step2Data;
          const spccApplicable =
            a.nonTransportationRelated &&
            a.aggregateAbovegroundCapacityGallons > 0 &&
            a.hasReasonableExpectationOfDischarge;
          const q = state.step3 as Step3Data;
          const qualResult = determineQualification({
            spccApplicable,
            aggregateAbovegroundCapacityGallons: a.aggregateAbovegroundCapacityGallons,
            maxIndividualContainerGallons: q.maxIndividualContainerGallons,
            singleDischargeGt1000Last3Years: q.singleDischargeGt1000Last3Years,
            twoDischargesGt42Within12MonthsLast3Years:
              q.twoDischargesGt42Within12MonthsLast3Years,
          });
          return { ...qualResult, spccApplicable };
        })()
      : null;

  const hints = props.completionHints;
  const hasApplicability = !!props.initialApplicability;
  const hasQualification = !!props.initialQualification;
  const hasAccountable = !!props.initialAccountable;
  const hasAssets = hints.assetCount > 0;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 h-1 rounded ${
              i + 1 <= step ? "bg-[var(--steel-blue)]" : "bg-[var(--border)]"
            }`}
            title={label}
          />
        ))}
      </div>

      <Card className="border-[var(--steel-blue)]/20 bg-[var(--mist-gray)]/25">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif">Facility readiness</CardTitle>
          <p className="text-sm text-[var(--muted)]">
            Progress outside this wizard is reflected from live data
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2 items-start">
              {hasApplicability ? (
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
              )}
              <div>
                <span className={hasApplicability ? "text-[var(--muted)]" : "font-medium"}>
                  Applicability assessment on file
                </span>
                {!hasApplicability && (
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Continue to step 2 in this wizard.
                  </p>
                )}
              </div>
            </li>
            <li className="flex gap-2 items-start">
              {hasQualification ? (
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
              )}
              <div>
                <span className={hasQualification ? "text-[var(--muted)]" : "font-medium"}>
                  Qualification assessment on file
                </span>
                {!hasQualification && (
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Complete step 3 after applicability.
                  </p>
                )}
              </div>
            </li>
            <li className="flex gap-2 items-start">
              {hasAccountable ? (
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
              )}
              <div>
                <span className={hasAccountable ? "text-[var(--muted)]" : "font-medium"}>
                  Accountable person recorded
                </span>
                {!hasAccountable && (
                  <p className="text-xs text-[var(--muted)] mt-0.5">Complete step 4 in this wizard.</p>
                )}
              </div>
            </li>
            <li className="flex gap-2 items-start">
              {hasAssets ? (
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
              )}
              <div>
                {hasAssets ? (
                  <span className="text-[var(--muted)]">
                    {hints.assetCount} asset{hints.assetCount === 1 ? "" : "s"} in registry
                  </span>
                ) : (
                  <>
                    <span className="font-medium">Asset registry</span>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      <Link
                        href={`/app/facilities/${props.facilityId}/assets/new`}
                        className="text-[var(--steel-blue)] hover:underline"
                      >
                        Add your first asset
                      </Link>{" "}
                      when the wizard is far enough along for your process.
                    </p>
                  </>
                )}
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Facility basics</CardTitle>
            <p className="text-sm text-[var(--muted)]">
              Name, address, industry, and operating context
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Facility name</Label>
                <Input {...step1Form.register("name")} />
                {step1Form.formState.errors.name && (
                  <p className="text-xs text-red-600">{step1Form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...step1Form.register("addressLine1")} placeholder="Street address" />
                <Input {...step1Form.register("addressLine2")} placeholder="Suite, unit, etc." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input {...step1Form.register("city")} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input {...step1Form.register("state")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Postal code</Label>
                <Input {...step1Form.register("postalCode")} />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input {...step1Form.register("industry")} placeholder="e.g. Manufacturing" />
              </div>
              <div className="space-y-2">
                <Label>Operating hours</Label>
                <Input {...step1Form.register("operatingHours")} placeholder="e.g. 24/7, Mon-Fri 8-5" />
              </div>
              <Button type="submit" disabled={step1Form.formState.isSubmitting}>
                Next: Applicability
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Applicability</CardTitle>
            <p className="text-sm text-[var(--muted)]">
              Determine whether SPCC applies to this facility
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="nonTransportation"
                  checked={step2Form.watch("nonTransportationRelated")}
                  onCheckedChange={(v) =>
                    step2Form.setValue("nonTransportationRelated", !!v)
                  }
                />
                <Label htmlFor="nonTransportation">
                  Non-transportation-related facility
                </Label>
              </div>
              <div className="space-y-2">
                <Label>Aggregate aboveground oil storage capacity (gallons)</Label>
                <Input
                  type="number"
                  min={0}
                  {...step2Form.register("aggregateAbovegroundCapacityGallons")}
                />
              </div>
              <div className="space-y-2">
                <Label>Completely buried storage capacity (gallons)</Label>
                <Input
                  type="number"
                  min={0}
                  {...step2Form.register("completelyBuriedCapacityGallons")}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="discharge"
                  checked={step2Form.watch("hasReasonableExpectationOfDischarge")}
                  onCheckedChange={(v) =>
                    step2Form.setValue("hasReasonableExpectationOfDischarge", !!v)
                  }
                />
                <Label htmlFor="discharge">
                  Reasonable expectation of discharge to navigable waters or adjoining shorelines?
                </Label>
              </div>
              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium">Excluded containers</p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="below55"
                    checked={step2Form.watch("hasContainersBelow55Excluded")}
                    onCheckedChange={(v) =>
                      step2Form.setValue("hasContainersBelow55Excluded", !!v)
                    }
                  />
                  <Label htmlFor="below55">Containers below 55 gallons excluded</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="permanentlyClosed"
                    checked={step2Form.watch("hasPermanentlyClosedContainersExcluded")}
                    onCheckedChange={(v) =>
                      step2Form.setValue("hasPermanentlyClosedContainersExcluded", !!v)
                    }
                  />
                  <Label htmlFor="permanentlyClosed">Permanently closed containers excluded</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="motivePower"
                    checked={step2Form.watch("hasMotivePowerContainersExcluded")}
                    onCheckedChange={(v) =>
                      step2Form.setValue("hasMotivePowerContainersExcluded", !!v)
                    }
                  />
                  <Label htmlFor="motivePower">Motive power containers excluded</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="wastewater"
                    checked={step2Form.watch("hasWastewaterTreatmentExclusions")}
                    onCheckedChange={(v) =>
                      step2Form.setValue("hasWastewaterTreatmentExclusions", !!v)
                    }
                  />
                  <Label htmlFor="wastewater">Wastewater treatment exclusions</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea {...step2Form.register("notes")} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={step2Form.formState.isSubmitting}>
                  Next: Qualification
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Qualification</CardTitle>
            <p className="text-sm text-[var(--muted)]">
              Determine qualified facility status and tier
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Maximum individual aboveground container capacity (gallons)</Label>
                <Input
                  type="number"
                  min={0}
                  {...step3Form.register("maxIndividualContainerGallons")}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="discharge1k"
                  checked={step3Form.watch("singleDischargeGt1000Last3Years")}
                  onCheckedChange={(v) =>
                    step3Form.setValue("singleDischargeGt1000Last3Years", !!v)
                  }
                />
                <Label htmlFor="discharge1k">
                  Any single discharge &gt; 1,000 gallons to water in last 3 years?
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="discharge42"
                  checked={step3Form.watch("twoDischargesGt42Within12MonthsLast3Years")}
                  onCheckedChange={(v) =>
                    step3Form.setValue("twoDischargesGt42Within12MonthsLast3Years", !!v)
                  }
                />
                <Label htmlFor="discharge42">
                  Two discharges &gt; 42 gallons each within 12 months in last 3 years?
                </Label>
              </div>
              {computed && (
                <div className="rounded-md border border-[var(--border)] p-4 bg-[var(--mist-gray)]">
                  <p className="text-sm font-medium">Preliminary result</p>
                  <p className="text-[var(--muted)] mt-1">Tier: {computed.tier.replace(/_/g, " ")}</p>
                  <p className="text-[var(--muted)] text-sm">{computed.rationale}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" disabled={step3Form.formState.isSubmitting}>
                  Next: Accountable person
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Accountable person</CardTitle>
            <p className="text-sm text-[var(--muted)]">
              Designate the person accountable for discharge prevention
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={step4Form.handleSubmit(handleStep4Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...step4Form.register("name")} />
                {step4Form.formState.errors.name && (
                  <p className="text-xs text-red-600">{step4Form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input {...step4Form.register("title")} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...step4Form.register("email")} />
                {step4Form.formState.errors.email && (
                  <p className="text-xs text-red-600">{step4Form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...step4Form.register("phone")} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button type="submit" disabled={step4Form.formState.isSubmitting}>
                  Next: Summary
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 5 - Summary */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <p className="text-sm text-[var(--muted)]">
              Review and complete setup
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Applicability</p>
              <p className="mt-1">
                SPCC {computed?.spccApplicable ? "applicable" : "not applicable"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Qualification tier</p>
              <p className="mt-1">{computed?.tier?.replace(/_/g, " ") ?? "—"}</p>
              {computed?.rationale && (
                <p className="text-sm text-[var(--muted)] mt-1">{computed.rationale}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">V1 fit</p>
              <p className="mt-1">{computed?.v1Fit ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Accountable person</p>
              <p className="mt-1">
                {state.step4?.name} ({state.step4?.email})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Recommended next step</p>
              <p className="mt-1">
                Complete facility profile, add assets and containment units, then begin
                inspection scheduling.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button onClick={handleComplete}>Complete setup</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
