import { prisma } from "@/lib/db";
import type { PlanStatus, PlanCertificationType, QualificationTier } from "@/generated/prisma/enums";

export const PLAN_SECTION_KEYS = [
  "APPLICABILITY",
  "FACILITY_INFORMATION",
  "FACILITY_DIAGRAM_AND_ATTACHMENTS",
  "OIL_STORAGE_INVENTORY",
  "SPILL_HISTORY",
  "SECONDARY_CONTAINMENT",
  "INSPECTION_AND_TESTING_PROCEDURES",
  "LOADING_UNLOADING_CONTROLS",
  "SECURITY_MEASURES",
  "PERSONNEL_AND_TRAINING",
  "EMERGENCY_CONTACTS_AND_RESPONSE_NOTES",
  "AMENDMENT_LOG",
  "ATTACHMENTS",
] as const;

export type PlanSectionKey = (typeof PLAN_SECTION_KEYS)[number];

export const PLAN_SECTION_TITLES: Record<PlanSectionKey, string> = {
  APPLICABILITY: "Applicability Determination",
  FACILITY_INFORMATION: "Facility Information",
  FACILITY_DIAGRAM_AND_ATTACHMENTS: "Facility Diagram and Attachments",
  OIL_STORAGE_INVENTORY: "Oil Storage Inventory",
  SPILL_HISTORY: "Spill History",
  SECONDARY_CONTAINMENT: "Secondary Containment",
  INSPECTION_AND_TESTING_PROCEDURES: "Inspection and Testing Procedures",
  LOADING_UNLOADING_CONTROLS: "Loading/Unloading Controls",
  SECURITY_MEASURES: "Security Measures",
  PERSONNEL_AND_TRAINING: "Personnel and Training",
  EMERGENCY_CONTACTS_AND_RESPONSE_NOTES: "Emergency Contacts and Response Notes",
  AMENDMENT_LOG: "Amendment Log",
  ATTACHMENTS: "Attachments",
};

export async function getOrCreatePlan(facilityId: string) {
  let plan = await prisma.plan.findUnique({
    where: { facilityId },
    include: {
      currentVersion: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        include: { sections: { orderBy: { sectionOrder: "asc" } } },
      },
    },
  });
  if (!plan) {
    plan = await prisma.plan.create({
      data: { facilityId },
      include: {
        currentVersion: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          include: { sections: { orderBy: { sectionOrder: "asc" } } },
        },
      },
    });
  }
  return plan;
}

export async function createDraftVersion(
  facilityId: string,
  createdByUserId: string,
  fromVersionId?: string
) {
  const plan = await getOrCreatePlan(facilityId);
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: {
      qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
      applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
    },
  });
  if (!facility) throw new Error("Facility not found");

  const lastVersion = plan.versions[0];
  const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;
  const sourceVersion = fromVersionId
    ? await prisma.planVersion.findFirst({
        where: { id: fromVersionId, planId: plan.id },
        include: { sections: true },
      })
    : lastVersion ?? null;

  const qual = facility.qualification[0];
  const qualificationTierSnapshot = qual?.tier ?? null;

  const version = await prisma.planVersion.create({
    data: {
      planId: plan.id,
      facilityId,
      versionNumber: nextVersionNumber,
      status: "DRAFT",
      qualificationTierSnapshot: qualificationTierSnapshot as QualificationTier | null,
      createdByUserId,
    },
  });

  const sectionDefaults = PLAN_SECTION_KEYS.map((key, i) => ({
    planVersionId: version.id,
    sectionKey: key,
    title: PLAN_SECTION_TITLES[key as PlanSectionKey],
    sectionOrder: i + 1,
    contentMode: "NARRATIVE",
    generatedFromSystem: ["OIL_STORAGE_INVENTORY", "PERSONNEL_AND_TRAINING", "SPILL_HISTORY", "APPLICABILITY", "SECONDARY_CONTAINMENT"].includes(key),
  }));

  if (sourceVersion?.sections.length) {
    for (const src of sourceVersion.sections) {
      await prisma.planSection.create({
        data: {
          planVersionId: version.id,
          sectionKey: src.sectionKey,
          title: src.title,
          sectionOrder: src.sectionOrder,
          contentMode: src.contentMode,
          structuredDataJson: src.structuredDataJson ?? undefined,
          narrativeText: src.narrativeText,
          generatedFromSystem: src.generatedFromSystem,
        },
      });
    }
  } else {
    const facilityWithData = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        profile: true,
        qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
        applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
        assets: { include: { oilType: true } },
        containmentUnits: true,
        personnel: true,
        trainingEvents: { include: { attendance: true } },
        incidents: true,
      },
    });

    for (let i = 0; i < sectionDefaults.length; i++) {
      const def = sectionDefaults[i];
      let structuredDataJson: object | null = null;
      if (def.generatedFromSystem && facilityWithData) {
        switch (def.sectionKey) {
          case "OIL_STORAGE_INVENTORY":
            structuredDataJson = { assets: facilityWithData.assets };
            break;
          case "PERSONNEL_AND_TRAINING":
            structuredDataJson = {
              personnel: facilityWithData.personnel,
              trainingEvents: facilityWithData.trainingEvents,
            };
            break;
          case "SPILL_HISTORY":
            structuredDataJson = { incidents: facilityWithData.incidents };
            break;
          case "APPLICABILITY":
            structuredDataJson = {
              applicability: facilityWithData.applicability[0],
              qualification: facilityWithData.qualification[0],
            };
            break;
          case "SECONDARY_CONTAINMENT":
            structuredDataJson = {
              containmentUnits: facilityWithData.containmentUnits,
            };
            break;
        }
      }
      await prisma.planSection.create({
        data: {
          ...def,
          structuredDataJson: structuredDataJson
            ? (JSON.parse(JSON.stringify(structuredDataJson)) as object)
            : undefined,
        },
      });
    }
  }

  return prisma.planVersion.findUnique({
    where: { id: version.id },
    include: { sections: { orderBy: { sectionOrder: "asc" } } },
  });
}

export async function approvePlanVersion(
  versionId: string,
  approvedByUserId: string,
  certification: {
    certificationType: PlanCertificationType;
    certifiedByName: string;
    certifiedByTitle?: string;
    certificationDate: Date;
    siteVisitDate?: Date;
    notes?: string;
  }
) {
  const version = await prisma.planVersion.findUnique({
    where: { id: versionId },
    include: { plan: true },
  });
  if (!version || version.status !== "DRAFT") throw new Error("Version not found or not editable");

  const facility = await prisma.facility.findUnique({
    where: { id: version.facilityId },
    include: {
      profile: true,
      qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
      applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
      assets: { include: { oilType: true } },
      containmentUnits: true,
      personnel: true,
      trainingEvents: { include: { attendance: true } },
      incidents: true,
      correctiveActions: true,
    },
  });
  if (!facility) throw new Error("Facility not found");

  const lockedSnapshot = {
    profile: facility.profile,
    qualification: facility.qualification[0],
    applicability: facility.applicability[0],
    assets: facility.assets,
    containmentUnits: facility.containmentUnits,
    personnel: facility.personnel,
    trainingEvents: facility.trainingEvents,
    incidents: facility.incidents,
    snapshotAt: new Date().toISOString(),
  };

  const previousCurrent = version.plan.currentVersionId;
  if (previousCurrent) {
    await prisma.planVersion.update({
      where: { id: previousCurrent },
      data: { status: "SUPERSEDED", supersededDate: new Date() },
    });
  }

  await prisma.planVersion.update({
    where: { id: versionId },
    data: {
      status: "APPROVED",
      effectiveDate: new Date(),
      certificationType: certification.certificationType,
      approvedByUserId,
      lockedSnapshotJson: lockedSnapshot,
    },
  });

  await prisma.planCertification.create({
    data: {
      planVersionId: versionId,
      certificationType: certification.certificationType,
      certifiedByName: certification.certifiedByName,
      certifiedByTitle: certification.certifiedByTitle ?? null,
      certificationDate: certification.certificationDate,
      siteVisitDate: certification.siteVisitDate ?? null,
      notes: certification.notes ?? null,
    },
  });

  await prisma.plan.update({
    where: { id: version.planId },
    data: { currentVersionId: versionId },
  });

  const profile = facility.profile;
  if (profile) {
    const nextReview = new Date();
    nextReview.setFullYear(nextReview.getFullYear() + 5);
    await prisma.facilityProfile.update({
      where: { facilityId: version.facilityId },
      data: {
        currentPlanEffectiveDate: new Date(),
        nextFiveYearReviewDate: nextReview,
      },
    });
  }
}
