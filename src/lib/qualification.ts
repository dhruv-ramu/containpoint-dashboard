import type { QualificationTier } from "@/generated/prisma/enums";

export type QualificationInput = {
  spccApplicable: boolean;
  aggregateAbovegroundCapacityGallons: number;
  maxIndividualContainerGallons?: number;
  singleDischargeGt1000Last3Years: boolean;
  twoDischargesGt42Within12MonthsLast3Years: boolean;
};

export type QualificationResult = {
  qualifiedFacility: boolean;
  tier: QualificationTier;
  v1Fit: "ideal" | "acceptable" | "out_of_scope" | "not_applicable";
  rationale: string;
};

export function determineQualification(input: QualificationInput): QualificationResult {
  if (!input.spccApplicable) {
    return {
      qualifiedFacility: false,
      tier: "NOT_QUALIFIED" as QualificationTier,
      v1Fit: "not_applicable",
      rationale: "SPCC is not applicable to this facility.",
    };
  }

  // Aboveground storage > 10,000 gallons => not qualified
  if (input.aggregateAbovegroundCapacityGallons > 10_000) {
    return {
      qualifiedFacility: false,
      tier: "NOT_QUALIFIED" as QualificationTier,
      v1Fit: "out_of_scope",
      rationale:
        "Aggregate aboveground storage exceeds 10,000 gallons. Facility requires PE certification.",
    };
  }

  // Discharge history disqualifies
  if (input.singleDischargeGt1000Last3Years) {
    return {
      qualifiedFacility: false,
      tier: "NOT_QUALIFIED" as QualificationTier,
      v1Fit: "out_of_scope",
      rationale:
        "Single discharge exceeding 1,000 gallons to navigable waters in the last 3 years disqualifies qualified facility status.",
    };
  }

  if (input.twoDischargesGt42Within12MonthsLast3Years) {
    return {
      qualifiedFacility: false,
      tier: "NOT_QUALIFIED" as QualificationTier,
      v1Fit: "out_of_scope",
      rationale:
        "Two discharges exceeding 42 gallons each within 12 months in the last 3 years disqualifies qualified facility status.",
    };
  }

  const maxIndividual = input.maxIndividualContainerGallons ?? 0;

  // Tier I: max individual container <= 5,000 gallons and otherwise qualified
  if (maxIndividual <= 5_000 && maxIndividual > 0) {
    return {
      qualifiedFacility: true,
      tier: "TIER_I" as QualificationTier,
      v1Fit: "ideal",
      rationale:
        "Qualified facility with no individual aboveground container exceeding 5,000 gallons. May use streamlined Appendix G template.",
    };
  }

  // Tier II: qualified but max container > 5,000
  if (maxIndividual > 5_000 || maxIndividual === 0) {
    const rationale =
      maxIndividual === 0
        ? "Qualified facility. Tier pending determination of maximum individual container capacity."
        : "Qualified facility with at least one container exceeding 5,000 gallons. Full self-certified plan required.";
    return {
      qualifiedFacility: true,
      tier: "TIER_II" as QualificationTier,
      v1Fit: "acceptable",
      rationale,
    };
  }

  return {
    qualifiedFacility: true,
    tier: "TIER_II" as QualificationTier,
    v1Fit: "acceptable",
    rationale: "Qualified facility.",
  };
}
