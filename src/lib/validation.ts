import { prisma } from "@/lib/db";

export type HardFailure = {
  code: string;
  message: string;
  sourceObjectType?: string;
  sourceObjectId?: string;
};

export type RiskFlag = {
  code: string;
  message: string;
  sourceObjectType?: string;
  sourceObjectId?: string;
};

export type ValidationOutput = {
  hardFailures: HardFailure[];
  riskFlags: RiskFlag[];
  overallStatus: "COMPLIANT" | "AT_RISK" | "NONCOMPLIANT";
};

const OVERDUE_THRESHOLD_DAYS = 7;

export async function computeValidation(facilityId: string): Promise<ValidationOutput> {
  const hardFailures: HardFailure[] = [];
  const riskFlags: RiskFlag[] = [];

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: {
      accountablePerson: true,
      assets: {
        where: { status: "ACTIVE" },
        include: { containmentLinks: true },
      },
      scheduledInspections: {
        where: { status: { not: "canceled" } },
        include: {
          template: true,
          runs: { orderBy: { performedAt: "desc" }, take: 1 },
        },
      },
      inspectionRuns: { where: { status: "completed" } },
    },
  });

  if (!facility) {
    return {
      hardFailures: [{ code: "FACILITY_NOT_FOUND", message: "Facility not found" }],
      riskFlags: [],
      overallStatus: "NONCOMPLIANT",
    };
  }

  // Hard: missing accountable person
  if (!facility.accountablePerson) {
    hardFailures.push({
      code: "MISSING_ACCOUNTABLE_PERSON",
      message: "No accountable person appointed",
      sourceObjectType: "Facility",
      sourceObjectId: facilityId,
    });
  }

  // Hard: asset requires containment but none linked
  for (const asset of facility.assets) {
    if (asset.requiresSizedContainment && asset.containmentLinks.length === 0) {
      hardFailures.push({
        code: "ASSET_REQUIRES_CONTAINMENT",
        message: `Asset ${asset.assetCode} requires sized containment but none linked`,
        sourceObjectType: "Asset",
        sourceObjectId: asset.id,
      });
    }
  }

  // Hard: overdue inspection past threshold
  const now = new Date();
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() - OVERDUE_THRESHOLD_DAYS);

  for (const s of facility.scheduledInspections) {
    if (s.status === "completed") continue;
    const due = new Date(s.dueDate);
        if (due < threshold) {
      const latestRun = s.runs[0];
      const hasCompletedRun = latestRun && latestRun.status === "completed" && latestRun.locked;
      if (!hasCompletedRun) {
        hardFailures.push({
          code: "INSPECTION_OVERDUE",
          message: `Inspection "${s.template?.name ?? "Unknown"}" overdue since ${due.toLocaleDateString()}`,
          sourceObjectType: "ScheduledInspection",
          sourceObjectId: s.id,
        });
      }
    }
  }

  // Hard: unsigned completed inspection
  const runsInProgress = facility.inspectionRuns.filter((r) => !r.locked && r.status === "completed");
  for (const r of runsInProgress) {
    hardFailures.push({
      code: "UNSIGNED_INSPECTION",
      message: "Completed inspection awaiting signature",
      sourceObjectType: "InspectionRun",
      sourceObjectId: r.id,
    });
  }

  // Risk: missing narrative justification (simplified - check facility profile)
  const profile = await prisma.facilityProfile.findUnique({
    where: { facilityId },
  });
  if (!profile?.dischargeExpectationNarrative?.trim()) {
    riskFlags.push({
      code: "MISSING_NARRATIVE",
      message: "Discharge expectation narrative not completed",
      sourceObjectType: "FacilityProfile",
      sourceObjectId: profile?.id,
    });
  }

  // Risk: incomplete inspection template basis
  const templates = await prisma.inspectionTemplate.findMany({
    where: {
      OR: [{ facilityId }, { facilityId: null, organizationId: facility.organizationId }],
      active: true,
    },
  });
  for (const t of templates) {
    if (!t.standardBasisRef?.trim() || !t.procedureText?.trim()) {
      riskFlags.push({
        code: "INCOMPLETE_TEMPLATE_BASIS",
        message: `Template "${t.name}" has incomplete standard basis or procedure`,
        sourceObjectType: "InspectionTemplate",
        sourceObjectId: t.id,
      });
    }
  }

  // Risk: inconsistent asset classification (asset has assetClass null or mismatched)
  for (const asset of facility.assets) {
    if (!asset.assetClass && asset.assetType) {
      riskFlags.push({
        code: "INCONSISTENT_ASSET_CLASS",
        message: `Asset ${asset.assetCode} has no asset class assigned`,
        sourceObjectType: "Asset",
        sourceObjectId: asset.id,
      });
    }
  }

  let overallStatus: "COMPLIANT" | "AT_RISK" | "NONCOMPLIANT" = "COMPLIANT";
  if (hardFailures.length > 0) overallStatus = "NONCOMPLIANT";
  else if (riskFlags.length > 0) overallStatus = "AT_RISK";

  return { hardFailures, riskFlags, overallStatus };
}

export async function persistValidationResult(
  facilityId: string,
  result: ValidationOutput
): Promise<void> {
  await prisma.validationResult.create({
    data: {
      facilityId,
      hardFailures: result.hardFailures,
      riskFlags: result.riskFlags,
      overallStatus: result.overallStatus,
    },
  });
}
