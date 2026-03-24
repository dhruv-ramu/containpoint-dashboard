import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import * as bcrypt from "bcryptjs";
import * as path from "path";
import * as fs from "fs";

import {
  OilTypeCategory,
  UserRole,
  FacilityStatus,
  QualificationTier,
  AssetType,
  AssetClass,
  AssetModeState,
  ContainmentType,
  ConditionStatus,
  RequirementSourceType,
  InspectionType,
  CorrectiveActionSeverity,
  CorrectiveActionStatus,
  TrainingEventType,
  ObligationType,
  ValidationSeverity,
  PlanStatus,
  PlanCertificationType,
  ReviewStatus,
  AmendmentType,
  AmendmentStatus,
  IncidentSeverity,
  ExportType,
  ExportStatus,
} from "../src/generated/prisma/enums";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required for seed");

const isAccelerate =
  url.startsWith("prisma://") || url.startsWith("prisma+postgres://");

const prisma = isAccelerate
  ? (new PrismaClient({
      accelerateUrl: url,
    }).$extends(withAccelerate()) as unknown as InstanceType<typeof PrismaClient>)
  : new PrismaClient({
      adapter: new PrismaPg({ connectionString: url }),
    });

const now = new Date();

function daysAgo(days: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
}

function daysAhead(days: number) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d;
}

async function ensureUploadDir() {
  const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}

async function createPlaceholderFile(objectType: string, objectId: string, name: string): Promise<string> {
  const UPLOAD_DIR = await ensureUploadDir();
  const storageKey = `seed-${objectType}-${objectId}-${Date.now()}.txt`;
  const content = `Placeholder attachment: ${name}\nCreated by seed at ${now.toISOString()}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, storageKey), content);
  return storageKey;
}

async function main() {
  console.log("Starting comprehensive seed...");

  const existingOrg = await prisma.organization.findFirst({ where: { slug: "demo-org" } });
  if (existingOrg) {
    const facilities = await prisma.facility.findMany({
      where: {
        organizationId: existingOrg.id,
        slug: { in: ["north-valley-fleet", "central-equipment-yard", "east-manufacturing"] },
      },
      select: { id: true },
    });
    const facilityIds = facilities.map((f) => f.id);
    if (facilityIds.length > 0) {
      console.log("Resetting existing seed data...");
      await prisma.fileAsset.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.validationResult.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.obligationRecord.deleteMany({ where: { facilityId: { in: facilityIds } } });
      const events = await prisma.trainingEvent.findMany({ where: { facilityId: { in: facilityIds } }, select: { id: true } });
      for (const e of events) {
        await prisma.trainingAttendance.deleteMany({ where: { eventId: e.id } });
        await prisma.trainingSignature.deleteMany({ where: { eventId: e.id } });
      }
      await prisma.trainingEvent.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.personnel.deleteMany({ where: { facilityId: { in: facilityIds } } });
      const actions = await prisma.correctiveAction.findMany({ where: { facilityId: { in: facilityIds } }, select: { id: true } });
      for (const a of actions) {
        await prisma.correctiveActionStatusHistory.deleteMany({ where: { actionId: a.id } });
        await prisma.correctiveActionComment.deleteMany({ where: { actionId: a.id } });
        await prisma.correctiveActionEvidence.deleteMany({ where: { actionId: a.id } });
      }
      await prisma.correctiveAction.deleteMany({ where: { facilityId: { in: facilityIds } } });
      const runs = await prisma.inspectionRun.findMany({ where: { facilityId: { in: facilityIds } }, select: { id: true } });
      for (const r of runs) {
        await prisma.inspectionItemResult.deleteMany({ where: { inspectionRunId: r.id } });
        await prisma.inspectionSignature.deleteMany({ where: { inspectionRunId: r.id } });
      }
      await prisma.inspectionRun.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.scheduledInspection.deleteMany({ where: { facilityId: { in: facilityIds } } });
      const assets = await prisma.asset.findMany({ where: { facilityId: { in: facilityIds } }, select: { id: true } });
      for (const a of assets) {
        await prisma.assetContainmentLink.deleteMany({ where: { assetId: a.id } });
      }
      await prisma.asset.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.containmentUnit.deleteMany({ where: { facilityId: { in: facilityIds } } });
      const planVersionIds = (await prisma.planVersion.findMany({ where: { facilityId: { in: facilityIds } }, select: { id: true } })).map((v) => v.id);
      const planSectionIds = (await prisma.planSection.findMany({ where: { planVersionId: { in: planVersionIds } }, select: { id: true } })).map((s) => s.id);
      if (planSectionIds.length > 0) await prisma.planSectionRevision.deleteMany({ where: { planSectionId: { in: planSectionIds } } });
      await prisma.planSection.deleteMany({ where: { planVersionId: { in: planVersionIds } } });
      await prisma.planCertification.deleteMany({ where: { planVersionId: { in: planVersionIds } } });
      await prisma.planReview.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.planAmendment.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.planVersion.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.plan.deleteMany({ where: { facilityId: { in: facilityIds } } });
      const incidentIds = (await prisma.incident.findMany({ where: { facilityId: { in: facilityIds } }, select: { id: true } })).map((i) => i.id);
      if (incidentIds.length > 0) await prisma.incidentFile.deleteMany({ where: { incidentId: { in: incidentIds } } });
      await prisma.incident.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.exportArtifact.deleteMany({ where: { exportJob: { facilityId: { in: facilityIds } } } });
      await prisma.exportJob.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.facilityApplicabilityAssessment.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.facilityQualificationRecord.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.facilityAccountablePerson.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.facilityProfile.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.facilityMembership.deleteMany({ where: { facilityId: { in: facilityIds } } });
      await prisma.facility.deleteMany({ where: { id: { in: facilityIds } } });
    }
  }

  // === OIL TYPES ===
  const oilTypeData = [
    { label: "Diesel", category: OilTypeCategory.DIESEL },
    { label: "Gasoline", category: OilTypeCategory.GASOLINE },
    { label: "Hydraulic Oil", category: OilTypeCategory.HYDRAULIC },
    { label: "Lube Oil", category: OilTypeCategory.LUBE },
    { label: "Used Oil", category: OilTypeCategory.USED_OIL },
    { label: "Transformer Oil", category: OilTypeCategory.TRANSFORMER },
    { label: "Crude Oil", category: OilTypeCategory.CRUDE },
    { label: "Other", category: OilTypeCategory.OTHER },
  ];

  const oilTypes: Record<string, string> = {};
  for (const ot of oilTypeData) {
    const existing = await prisma.oilType.findFirst({ where: { label: ot.label } });
    if (existing) {
      oilTypes[ot.label] = existing.id;
    } else {
      const created = await prisma.oilType.create({
        data: { label: ot.label, category: ot.category, active: true },
      });
      oilTypes[ot.label] = created.id;
    }
  }

  // === USER & ORG ===
  const passwordHash = await bcrypt.hash("Seed1234!", 10);
  const user = await prisma.user.upsert({
    where: { email: "seed@containpoint.com" },
    create: {
      name: "Seed Facility User",
      email: "seed@containpoint.com",
      passwordHash,
    },
    update: { passwordHash },
  });

  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    create: { name: "Demo Organization", slug: "demo-org" },
    update: {},
  });

  await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    create: {
      userId: user.id,
      organizationId: org.id,
      role: UserRole.ORG_ADMIN,
    },
    update: {},
  });

  // === REGULATORY REQUIREMENTS ===
  const reqs = [
    { code: "AP-001", title: "Accountable Person", sourceType: RequirementSourceType.REGULATION, citationRef: "40 CFR 112.7(a)", summary: "Facility must designate an accountable person" },
    { code: "INSP-001", title: "Signed Inspection Records", sourceType: RequirementSourceType.REGULATION, citationRef: "40 CFR 112.7(e)", summary: "Inspections must be documented and signed" },
    { code: "TRAIN-001", title: "Annual Briefing", sourceType: RequirementSourceType.REGULATION, citationRef: "40 CFR 112.7(f)", summary: "Annual SPCC training/briefing within 365 days" },
    { code: "CONT-001", title: "Containment Adequacy", sourceType: RequirementSourceType.REGULATION, citationRef: "40 CFR 112.7(c)", summary: "Secondary containment sized for largest container" },
    { code: "SCHED-001", title: "Inspection Schedule", sourceType: RequirementSourceType.GUIDANCE, citationRef: "EPA SPCC Guidance", summary: "Regular inspections per facility procedures" },
    { code: "CA-001", title: "Corrective Action Closure", sourceType: RequirementSourceType.REGULATION, citationRef: "40 CFR 112.7(e)", summary: "Failed inspection items require corrective action with evidence" },
    { code: "QUAL-001", title: "Spill History Qualification", sourceType: RequirementSourceType.REGULATION, citationRef: "40 CFR 112.3", summary: "Qualification tier based on discharge history" },
    { code: "MOB-001", title: "Mobile/Portable Container Control", sourceType: RequirementSourceType.GUIDANCE, citationRef: "EPA SPCC Guidance", summary: "Mobile containers require mode-state controls when applicable" },
  ];

  const requirements: Record<string, string> = {};
  for (const r of reqs) {
    const existing = await prisma.regulatoryRequirement.findFirst({
      where: { organizationId: org.id, requirementCode: r.code },
    });
    if (existing) {
      requirements[r.code] = existing.id;
    } else {
      const created = await prisma.regulatoryRequirement.create({
        data: {
          organizationId: org.id,
          requirementCode: r.code,
          title: r.title,
          sourceType: r.sourceType,
          citationRef: r.citationRef,
          summary: r.summary,
          active: true,
        },
      });
      requirements[r.code] = created.id;
    }
  }

  // === FACILITY A: North Valley Fleet Depot - mostly healthy ===
  const facilityA = await prisma.facility.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "north-valley-fleet" } },
    create: {
      organizationId: org.id,
      name: "North Valley Fleet Depot",
      slug: "north-valley-fleet",
      status: FacilityStatus.ACTIVE,
    },
    update: {},
  });

  await prisma.facilityMembership.upsert({
    where: { facilityId_userId: { facilityId: facilityA.id, userId: user.id } },
    create: { facilityId: facilityA.id, userId: user.id, role: UserRole.FACILITY_MANAGER },
    update: {},
  });

  await prisma.facilityProfile.upsert({
    where: { facilityId: facilityA.id },
    create: {
      facilityId: facilityA.id,
      legalName: "North Valley Fleet Services, LLC",
      dbaName: "North Valley Fleet Depot",
      addressLine1: "1847 Industrial Park Drive",
      city: "Fresno",
      state: "CA",
      postalCode: "93721",
      country: "US",
      latitude: 36.7378,
      longitude: -119.7871,
      naicsCode: "484121",
      industry: "Trucking / logistics yard",
      dischargeExpectationNarrative: "Routine truck maintenance and fueling operations. No direct pathway to navigable waters. Drainage flows to onsite retention. Spills would be contained within paved yard.",
      nearestWaterbody: "Fresno Slough (approx. 2.3 miles NE)",
      operatingHours: "24/7",
      emergencyContactName: "Maria Santos",
      emergencyContactPhone: "(559) 555-0101",
      nextFiveYearReviewDate: daysAhead(1095),
    },
    update: {},
  });

  await prisma.facilityAccountablePerson.upsert({
    where: { facilityId: facilityA.id },
    create: {
      facilityId: facilityA.id,
      name: "Maria Santos",
      title: "Facility Manager",
      email: "msantos@northvalleyfleet.com",
      phone: "(559) 555-0101",
    },
    update: {},
  });

  await prisma.facilityApplicabilityAssessment.create({
    data: {
      facilityId: facilityA.id,
      nonTransportationRelated: true,
      aggregateAbovegroundCapacityGallons: 4500,
      completelyBuriedCapacityGallons: 0,
      hasReasonableExpectationOfDischarge: true,
      hasContainersBelow55Excluded: false,
      hasPermanentlyClosedContainersExcluded: false,
      hasMotivePowerContainersExcluded: false,
      hasWastewaterTreatmentExclusions: false,
      spccApplicable: true,
      assessedAt: daysAgo(180),
      assessedByUserId: user.id,
    },
  });

  await prisma.facilityQualificationRecord.create({
    data: {
      facilityId: facilityA.id,
      qualifiedFacility: true,
      tier: QualificationTier.TIER_I,
      maxIndividualContainerGallons: 2000,
      singleDischargeGt1000Last3Years: false,
      twoDischargesGt42Within12MonthsLast3Years: false,
      qualificationRationale: "Tier I qualified. No reportable discharges in past 3 years.",
      assessedAt: daysAgo(180),
      assessedByUserId: user.id,
    },
  });

  // Facility A assets
  const dieselAst1 = await prisma.asset.create({
    data: {
      facilityId: facilityA.id,
      assetCode: "DIESEL-AST-1",
      name: "Diesel AST #1",
      assetType: AssetType.BULK_STORAGE_CONTAINER,
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      oilTypeId: oilTypes["Diesel"],
      storageCapacityGallons: 2000,
      typicalFillPercent: 75,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 30,
      lastInspectionDate: daysAgo(15),
      nextInspectionDate: daysAhead(15),
      requiresSizedContainment: true,
      comments: "Primary diesel storage for fleet fueling",
    },
  });

  const dieselAst2 = await prisma.asset.create({
    data: {
      facilityId: facilityA.id,
      assetCode: "DIESEL-AST-2",
      name: "Diesel AST #2",
      assetType: AssetType.BULK_STORAGE_CONTAINER,
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      oilTypeId: oilTypes["Diesel"],
      storageCapacityGallons: 1500,
      typicalFillPercent: 70,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 30,
      lastInspectionDate: daysAgo(20),
      nextInspectionDate: daysAhead(10),
      requiresSizedContainment: true,
      comments: "Secondary diesel storage",
    },
  });

  const usedOilTote = await prisma.asset.create({
    data: {
      facilityId: facilityA.id,
      assetCode: "USED-OIL-TOTE-1",
      name: "Used Oil Tote #1",
      assetType: AssetType.DRUM_TOTE,
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      oilTypeId: oilTypes["Used Oil"],
      storageCapacityGallons: 275,
      typicalFillPercent: 60,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 30,
      requiresSizedContainment: false,
      comments: "275 gal tote for used oil collection",
    },
  });

  const hydraulicDrum = await prisma.asset.create({
    data: {
      facilityId: facilityA.id,
      assetCode: "HYD-DRUM-1",
      name: "Hydraulic Oil Drum Storage",
      assetType: AssetType.DRUM_TOTE,
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      oilTypeId: oilTypes["Hydraulic Oil"],
      storageCapacityGallons: 220,
      typicalFillPercent: 80,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: true,
      status: "ACTIVE",
      inspectionFrequencyDays: 30,
      requiresSizedContainment: false,
      comments: "4 x 55 gal drums equivalent",
    },
  });

  const loadingAreaA = await prisma.asset.create({
    data: {
      facilityId: facilityA.id,
      assetCode: "LOAD-AREA-1",
      name: "Loading / transfer area",
      assetType: AssetType.LOADING_UNLOADING_AREA,
      assetClass: AssetClass.TRANSFER_AREA,
      oilTypeId: oilTypes["Diesel"],
      storageCapacityGallons: null,
      countedTowardThreshold: false,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 7,
      requiresSizedContainment: false,
      comments: "Primary fueling transfer area",
    },
  });

  // Facility A containment
  const containmentA = await prisma.containmentUnit.create({
    data: {
      facilityId: facilityA.id,
      code: "BERM-DIESEL",
      name: "Diesel Tank Secondary Containment Berm",
      containmentType: ContainmentType.DIKE_BERM,
      largestSingleTankCapacityGallons: 2000,
      capacityCalculationMethod: "Berm dimensions 20ft x 15ft x 1.5ft freeboard",
      calculatedCapacityGallons: 3500,
      drainageControlNotes: "Manual valves, closed when not draining. No pathway to storm sewer.",
      conditionStatus: ConditionStatus.GOOD,
      lastInspectionDate: daysAgo(15),
      comments: "Serves Diesel AST #1 and #2",
    },
  });

  await prisma.assetContainmentLink.createMany({
    data: [
      { assetId: dieselAst1.id, containmentUnitId: containmentA.id },
      { assetId: dieselAst2.id, containmentUnitId: containmentA.id },
    ],
    skipDuplicates: true,
  });

  // === FACILITY B: Central Equipment Yard - at risk ===
  const facilityB = await prisma.facility.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "central-equipment-yard" } },
    create: {
      organizationId: org.id,
      name: "Central Equipment Yard",
      slug: "central-equipment-yard",
      status: FacilityStatus.ACTIVE,
    },
    update: {},
  });

  await prisma.facilityMembership.upsert({
    where: { facilityId_userId: { facilityId: facilityB.id, userId: user.id } },
    create: { facilityId: facilityB.id, userId: user.id, role: UserRole.FACILITY_MANAGER },
    update: {},
  });

  await prisma.facilityProfile.upsert({
    where: { facilityId: facilityB.id },
    create: {
      facilityId: facilityB.id,
      legalName: "Central Valley Equipment Rentals, Inc.",
      dbaName: "Central Equipment Yard",
      addressLine1: "4200 Machinery Lane",
      city: "Modesto",
      state: "CA",
      postalCode: "95358",
      country: "US",
      latitude: 37.6391,
      longitude: -120.9969,
      naicsCode: "532412",
      industry: "Heavy equipment rental yard",
      dischargeExpectationNarrative: "Equipment fueling and maintenance. Yard drainage flows to perimeter swale. Potential for small spills during refueling operations.",
      nearestWaterbody: "Tuolumne River (approx. 1.1 miles W)",
      operatingHours: "6am-6pm M-Sat",
      emergencyContactName: "James Wu",
      emergencyContactPhone: "(209) 555-0202",
      nextFiveYearReviewDate: daysAhead(730),
    },
    update: {},
  });

  await prisma.facilityAccountablePerson.upsert({
    where: { facilityId: facilityB.id },
    create: {
      facilityId: facilityB.id,
      name: "James Wu",
      title: "Operations Manager",
      email: "jwu@centralequipment.com",
      phone: "(209) 555-0202",
    },
    update: {},
  });

  await prisma.facilityApplicabilityAssessment.create({
    data: {
      facilityId: facilityB.id,
      nonTransportationRelated: true,
      aggregateAbovegroundCapacityGallons: 7500,
      completelyBuriedCapacityGallons: 0,
      hasReasonableExpectationOfDischarge: true,
      hasContainersBelow55Excluded: false,
      hasPermanentlyClosedContainersExcluded: false,
      hasMotivePowerContainersExcluded: false,
      hasWastewaterTreatmentExclusions: false,
      spccApplicable: true,
      assessedAt: daysAgo(120),
      assessedByUserId: user.id,
    },
  });

  await prisma.facilityQualificationRecord.create({
    data: {
      facilityId: facilityB.id,
      qualifiedFacility: true,
      tier: QualificationTier.TIER_II,
      maxIndividualContainerGallons: 4000,
      singleDischargeGt1000Last3Years: false,
      twoDischargesGt42Within12MonthsLast3Years: false,
      qualificationRationale: "Tier II qualified. Aggregate capacity exceeds 10,000 gal.",
      assessedAt: daysAgo(120),
      assessedByUserId: user.id,
    },
  });

  const dieselMainB = await prisma.asset.create({
    data: {
      facilityId: facilityB.id,
      assetCode: "DIESEL-MAIN",
      name: "Diesel AST Main",
      assetType: AssetType.BULK_STORAGE_CONTAINER,
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      oilTypeId: oilTypes["Diesel"],
      storageCapacityGallons: 4000,
      typicalFillPercent: 80,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 30,
      lastInspectionDate: daysAgo(45),
      nextInspectionDate: daysAgo(15),
      requiresSizedContainment: true,
      comments: "Primary equipment fueling tank",
    },
  });

  const lubeAstB = await prisma.asset.create({
    data: {
      facilityId: facilityB.id,
      assetCode: "LUBE-AST",
      name: "Lube Oil AST",
      assetType: AssetType.BULK_STORAGE_CONTAINER,
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      oilTypeId: oilTypes["Lube Oil"],
      storageCapacityGallons: 1000,
      typicalFillPercent: 70,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 30,
      requiresSizedContainment: true,
      comments: "Bulk lube storage",
    },
  });

  const usedOilTankB = await prisma.asset.create({
    data: {
      facilityId: facilityB.id,
      assetCode: "USED-OIL-TANK",
      name: "Used Oil Tank",
      assetType: AssetType.BULK_STORAGE_CONTAINER,
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      oilTypeId: oilTypes["Used Oil"],
      storageCapacityGallons: 500,
      typicalFillPercent: 50,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 30,
      requiresSizedContainment: true,
      comments: "Used oil collection",
    },
  });

  const mobileToteB1 = await prisma.asset.create({
    data: {
      facilityId: facilityB.id,
      assetCode: "MOB-DIESEL-1",
      name: "Mobile Portable Diesel Tote #1",
      assetType: AssetType.MOBILE_CONTAINER,
      assetClass: AssetClass.MOBILE_PORTABLE_CONTAINER,
      oilTypeId: oilTypes["Diesel"],
      storageCapacityGallons: 110,
      typicalFillPercent: 90,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      modeState: AssetModeState.STATIONARY_UNATTENDED,
      underDirectControl: true,
      requiresSizedContainment: false,
      inspectionFrequencyDays: 14,
      comments: "110 gal mobile fuel tote",
    },
  });

  const mobileToteB2 = await prisma.asset.create({
    data: {
      facilityId: facilityB.id,
      assetCode: "MOB-DIESEL-2",
      name: "Mobile Portable Diesel Tote #2",
      assetType: AssetType.MOBILE_CONTAINER,
      assetClass: AssetClass.MOBILE_PORTABLE_CONTAINER,
      oilTypeId: oilTypes["Diesel"],
      storageCapacityGallons: 110,
      typicalFillPercent: 85,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      modeState: AssetModeState.ACTIVE_TRANSFER_UNDER_CONTROL,
      underDirectControl: true,
      requiresSizedContainment: false,
      inspectionFrequencyDays: 14,
      comments: "Field refueling tote",
    },
  });

  const transferAreaB = await prisma.asset.create({
    data: {
      facilityId: facilityB.id,
      assetCode: "XFER-AREA-1",
      name: "Transfer area",
      assetType: AssetType.TRANSFER_AREA,
      assetClass: AssetClass.TRANSFER_AREA,
      oilTypeId: oilTypes["Diesel"],
      storageCapacityGallons: null,
      countedTowardThreshold: false,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 7,
      comments: "Equipment refueling pad",
    },
  });

  // Facility B containment - questionable/partial to trigger validation
  const containmentB = await prisma.containmentUnit.create({
    data: {
      facilityId: facilityB.id,
      code: "BERM-MAIN",
      name: "Main Tank Berm",
      containmentType: ContainmentType.DIKE_BERM,
      largestSingleTankCapacityGallons: 4000,
      capacityCalculationMethod: null,
      calculatedCapacityGallons: null,
      drainageControlNotes: "Partial documentation",
      conditionStatus: ConditionStatus.FAIR,
      lastInspectionDate: daysAgo(45),
      comments: "Incomplete capacity documentation - at risk",
    },
  });

  await prisma.assetContainmentLink.createMany({
    data: [
      { assetId: dieselMainB.id, containmentUnitId: containmentB.id },
      { assetId: lubeAstB.id, containmentUnitId: containmentB.id },
    ],
    skipDuplicates: true,
  });
  // usedOilTankB intentionally NOT linked - requires containment, will trigger hard failure

  // === FACILITY C: East Manufacturing Site - mixed ===
  const facilityC = await prisma.facility.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "east-manufacturing" } },
    create: {
      organizationId: org.id,
      name: "East Manufacturing Site",
      slug: "east-manufacturing",
      status: FacilityStatus.ACTIVE,
    },
    update: {},
  });

  await prisma.facilityMembership.upsert({
    where: { facilityId_userId: { facilityId: facilityC.id, userId: user.id } },
    create: { facilityId: facilityC.id, userId: user.id, role: UserRole.FACILITY_MANAGER },
    update: {},
  });

  await prisma.facilityProfile.upsert({
    where: { facilityId: facilityC.id },
    create: {
      facilityId: facilityC.id,
      legalName: "East Valley Manufacturing Corp.",
      dbaName: "East Manufacturing Site",
      addressLine1: "5500 Production Way",
      city: "Bakersfield",
      state: "CA",
      postalCode: "93309",
      country: "US",
      latitude: 35.3733,
      longitude: -119.0187,
      naicsCode: "332710",
      industry: "Manufacturing / generator / lube oil storage",
      dischargeExpectationNarrative: "Manufacturing facility with backup generators, hydraulic systems, and lube oil storage. Yard drainage to retention basin. Spill risk from transfer and equipment operations.",
      nearestWaterbody: "Kern River (approx. 3 miles E)",
      operatingHours: "7am-4pm M-F",
      emergencyContactName: "Robert Chen",
      emergencyContactPhone: "(661) 555-0303",
      nextFiveYearReviewDate: daysAhead(1460),
    },
    update: {},
  });

  await prisma.facilityAccountablePerson.upsert({
    where: { facilityId: facilityC.id },
    create: {
      facilityId: facilityC.id,
      name: "Robert Chen",
      title: "Plant Manager",
      email: "rchen@eastmfg.com",
      phone: "(661) 555-0303",
    },
    update: {},
  });

  await prisma.facilityApplicabilityAssessment.create({
    data: {
      facilityId: facilityC.id,
      nonTransportationRelated: true,
      aggregateAbovegroundCapacityGallons: 8500,
      completelyBuriedCapacityGallons: 0,
      hasReasonableExpectationOfDischarge: true,
      hasContainersBelow55Excluded: false,
      hasPermanentlyClosedContainersExcluded: false,
      hasMotivePowerContainersExcluded: false,
      hasWastewaterTreatmentExclusions: false,
      spccApplicable: true,
      assessedAt: daysAgo(90),
      assessedByUserId: user.id,
    },
  });

  await prisma.facilityQualificationRecord.create({
    data: {
      facilityId: facilityC.id,
      qualifiedFacility: false,
      tier: QualificationTier.TIER_II,
      maxIndividualContainerGallons: 3000,
      singleDischargeGt1000Last3Years: true,
      twoDischargesGt42Within12MonthsLast3Years: false,
      qualificationRationale: "Tier II capacity. Single reportable discharge in past 3 years. PE certification required for plan.",
      assessedAt: daysAgo(90),
      assessedByUserId: user.id,
    },
  });

  const genDieselC = await prisma.asset.create({
    data: {
      facilityId: facilityC.id,
      assetCode: "GEN-DIESEL",
      name: "Generator Diesel Tank",
      assetType: AssetType.BULK_STORAGE_CONTAINER,
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      oilTypeId: oilTypes["Diesel"],
      storageCapacityGallons: 3000,
      typicalFillPercent: 90,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 30,
      requiresSizedContainment: true,
      comments: "Backup generator fuel",
    },
  });

  const hydraulicResC = await prisma.asset.create({
    data: {
      facilityId: facilityC.id,
      assetCode: "HYD-RES-1",
      name: "Hydraulic Oil Reservoir Storage",
      assetType: AssetType.BULK_STORAGE_CONTAINER,
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      oilTypeId: oilTypes["Hydraulic Oil"],
      storageCapacityGallons: 800,
      typicalFillPercent: 75,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: true,
      status: "ACTIVE",
      inspectionFrequencyDays: 30,
      requiresSizedContainment: false,
      comments: "Hydraulic system reservoir",
    },
  });

  const transformerC = await prisma.asset.create({
    data: {
      facilityId: facilityC.id,
      assetCode: "XFMR-OIL-1",
      name: "Transformer Oil Equipment",
      assetType: AssetType.TRANSFORMER,
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      oilTypeId: oilTypes["Transformer Oil"],
      storageCapacityGallons: 500,
      typicalFillPercent: 95,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 90,
      requiresSizedContainment: true,
      comments: "Transformer oil storage",
    },
  });

  const mobileFuelC = await prisma.asset.create({
    data: {
      facilityId: facilityC.id,
      assetCode: "MOB-FUEL-1",
      name: "Mobile Portable Fuel Container",
      assetType: AssetType.MOBILE_CONTAINER,
      assetClass: AssetClass.MOBILE_PORTABLE_CONTAINER,
      oilTypeId: oilTypes["Diesel"],
      storageCapacityGallons: 55,
      typicalFillPercent: 80,
      countedTowardThreshold: true,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      modeState: AssetModeState.ACTIVE_TRANSFER_UNDER_CONTROL,
      underDirectControl: true,
      containmentValidationBasis: "55-gal drum on spill pallet during transfer",
      requiresSizedContainment: false,
      inspectionFrequencyDays: 14,
      comments: "Job-site refueling container with mode state",
    },
  });

  const loadingAreaC = await prisma.asset.create({
    data: {
      facilityId: facilityC.id,
      assetCode: "LOAD-AREA-1",
      name: "Loading area",
      assetType: AssetType.LOADING_UNLOADING_AREA,
      assetClass: AssetClass.TRANSFER_AREA,
      oilTypeId: oilTypes["Diesel"],
      storageCapacityGallons: null,
      countedTowardThreshold: false,
      aboveground: true,
      indoor: false,
      status: "ACTIVE",
      inspectionFrequencyDays: 7,
      comments: "Tanker loading pad",
    },
  });

  // Facility C containment - multiple units, transformer missing link
  const containmentC1 = await prisma.containmentUnit.create({
    data: {
      facilityId: facilityC.id,
      code: "BERM-GEN",
      name: "Generator Tank Berm",
      containmentType: ContainmentType.DIKE_BERM,
      largestSingleTankCapacityGallons: 3000,
      capacityCalculationMethod: "Concrete berm 25ft x 12ft x 2ft",
      calculatedCapacityGallons: 4500,
      drainageControlNotes: "Closed valves, no storm connection",
      conditionStatus: ConditionStatus.GOOD,
      lastInspectionDate: daysAgo(20),
      comments: "Serves generator diesel tank",
    },
  });

  const containmentC2 = await prisma.containmentUnit.create({
    data: {
      facilityId: facilityC.id,
      code: "PALLET-XFMR",
      name: "Transformer Spill Pallet",
      containmentType: ContainmentType.PALLET,
      largestSingleTankCapacityGallons: 500,
      calculatedCapacityGallons: 550,
      drainageControlNotes: "Integral sump",
      conditionStatus: ConditionStatus.GOOD,
      comments: "Transformer oil - asset link missing to trigger validation",
    },
  });

  await prisma.assetContainmentLink.createMany({
    data: [
      { assetId: genDieselC.id, containmentUnitId: containmentC1.id },
      // transformerC intentionally NOT linked to containmentC2 - containment linkage issue
    ],
    skipDuplicates: true,
  });

  // === INSPECTION TEMPLATES ===
  const bulkTemplate = await prisma.inspectionTemplate.upsert({
    where: { id: "seed-bulk-template" },
    create: {
      id: "seed-bulk-template",
      organizationId: org.id,
      facilityId: null,
      name: "Bulk Storage Container Monthly Visual Inspection",
      assetClass: AssetClass.BULK_STORAGE_CONTAINER,
      inspectionType: InspectionType.VISUAL,
      standardBasisRef: "40 CFR 112.7(e)(2)",
      procedureText: "Visual inspection of aboveground storage tank and secondary containment. Check for corrosion, leaks, overfill protection. Document condition.",
      expectedFrequencyDays: 30,
      performerQualificationBasis: "Trained inspector",
      active: true,
    },
    update: {},
  });

  const bulkVersion = await prisma.inspectionTemplateVersion.upsert({
    where: { templateId_version: { templateId: bulkTemplate.id, version: 1 } },
    create: {
      templateId: bulkTemplate.id,
      version: 1,
      active: true,
    },
    update: {},
  });

  const bulkItems = await Promise.all([
    prisma.inspectionTemplateItem.upsert({
      where: { id: "seed-bulk-item-1" },
      create: {
        id: "seed-bulk-item-1",
        templateVersionId: bulkVersion.id,
        sequenceOrder: 1,
        prompt: "Tank exterior free of visible corrosion or damage?",
        responseType: "boolean",
        required: true,
        failureSeverity: CorrectiveActionSeverity.MEDIUM,
        regulatoryRequirementId: requirements["INSP-001"],
        autoCreateCorrectiveAction: true,
      },
      update: {},
    }),
    prisma.inspectionTemplateItem.upsert({
      where: { id: "seed-bulk-item-2" },
      create: {
        id: "seed-bulk-item-2",
        templateVersionId: bulkVersion.id,
        sequenceOrder: 2,
        prompt: "No visible leaks, staining, or sheen in containment?",
        responseType: "boolean",
        required: true,
        failureSeverity: CorrectiveActionSeverity.HIGH,
        regulatoryRequirementId: requirements["CONT-001"],
        autoCreateCorrectiveAction: true,
      },
      update: {},
    }),
    prisma.inspectionTemplateItem.upsert({
      where: { id: "seed-bulk-item-3" },
      create: {
        id: "seed-bulk-item-3",
        templateVersionId: bulkVersion.id,
        sequenceOrder: 3,
        prompt: "Photo of tank and containment area",
        responseType: "photo_required",
        required: true,
        failureSeverity: CorrectiveActionSeverity.LOW,
        autoCreateCorrectiveAction: false,
      },
      update: {},
    }),
  ]);

  const containmentTemplate = await prisma.inspectionTemplate.upsert({
    where: { id: "seed-contain-template" },
    create: {
      id: "seed-contain-template",
      organizationId: org.id,
      facilityId: null,
      name: "Containment Unit Inspection",
      assetClass: AssetClass.CONTAINMENT_UNIT,
      inspectionType: InspectionType.FORMAL_VISUAL,
      standardBasisRef: "40 CFR 112.7(c)",
      procedureText: "Inspect containment structure for cracks, standing oil, drainage controls, valve position.",
      expectedFrequencyDays: 30,
      performerQualificationBasis: "Trained inspector",
      active: true,
    },
    update: {},
  });

  const containmentVersion = await prisma.inspectionTemplateVersion.upsert({
    where: { templateId_version: { templateId: containmentTemplate.id, version: 1 } },
    create: {
      templateId: containmentTemplate.id,
      version: 1,
      active: true,
    },
    update: {},
  });

  await Promise.all([
    prisma.inspectionTemplateItem.upsert({
      where: { id: "seed-cont-item-1" },
      create: {
        id: "seed-cont-item-1",
        templateVersionId: containmentVersion.id,
        sequenceOrder: 1,
        prompt: "No cracks or deterioration in berm/pad?",
        responseType: "boolean",
        required: true,
        failureSeverity: CorrectiveActionSeverity.MEDIUM,
        autoCreateCorrectiveAction: true,
      },
      update: {},
    }),
    prisma.inspectionTemplateItem.upsert({
      where: { id: "seed-cont-item-2" },
      create: {
        id: "seed-cont-item-2",
        templateVersionId: containmentVersion.id,
        sequenceOrder: 2,
        prompt: "No standing oil or evidence of release?",
        responseType: "boolean",
        required: true,
        failureSeverity: CorrectiveActionSeverity.HIGH,
        autoCreateCorrectiveAction: true,
      },
      update: {},
    }),
    prisma.inspectionTemplateItem.upsert({
      where: { id: "seed-cont-item-3" },
      create: {
        id: "seed-cont-item-3",
        templateVersionId: containmentVersion.id,
        sequenceOrder: 3,
        prompt: "Drainage valves in correct position?",
        responseType: "boolean",
        required: true,
        failureSeverity: CorrectiveActionSeverity.MEDIUM,
        autoCreateCorrectiveAction: true,
      },
      update: {},
    }),
  ]);

  const transferTemplate = await prisma.inspectionTemplate.upsert({
    where: { id: "seed-transfer-template" },
    create: {
      id: "seed-transfer-template",
      organizationId: org.id,
      facilityId: null,
      name: "Transfer Area Inspection",
      assetClass: AssetClass.TRANSFER_AREA,
      inspectionType: InspectionType.VISUAL,
      standardBasisRef: "40 CFR 112.7(e)",
      procedureText: "Inspect transfer area for staining, housekeeping, spill kit availability.",
      expectedFrequencyDays: 7,
      performerQualificationBasis: "Trained operator",
      active: true,
    },
    update: {},
  });

  const transferVersion = await prisma.inspectionTemplateVersion.upsert({
    where: { templateId_version: { templateId: transferTemplate.id, version: 1 } },
    create: {
      templateId: transferTemplate.id,
      version: 1,
      active: true,
    },
    update: {},
  });

  await Promise.all([
    prisma.inspectionTemplateItem.upsert({
      where: { id: "seed-xfer-item-1" },
      create: {
        id: "seed-xfer-item-1",
        templateVersionId: transferVersion.id,
        sequenceOrder: 1,
        prompt: "No staining or evidence of spills?",
        responseType: "boolean",
        required: true,
        failureSeverity: CorrectiveActionSeverity.MEDIUM,
        autoCreateCorrectiveAction: true,
      },
      update: {},
    }),
    prisma.inspectionTemplateItem.upsert({
      where: { id: "seed-xfer-item-2" },
      create: {
        id: "seed-xfer-item-2",
        templateVersionId: transferVersion.id,
        sequenceOrder: 2,
        prompt: "Spill kit present and stocked?",
        responseType: "boolean",
        required: true,
        failureSeverity: CorrectiveActionSeverity.MEDIUM,
        autoCreateCorrectiveAction: true,
      },
      update: {},
    }),
  ]);

  const mobileTemplate = await prisma.inspectionTemplate.upsert({
    where: { id: "seed-mobile-template" },
    create: {
      id: "seed-mobile-template",
      organizationId: org.id,
      facilityId: null,
      name: "Mobile/Portable Container Stationary Storage Check",
      assetClass: AssetClass.MOBILE_PORTABLE_CONTAINER,
      inspectionType: InspectionType.VISUAL,
      standardBasisRef: "EPA SPCC Guidance",
      procedureText: "Inspect mobile container when stationary. Verify mode state controls if applicable.",
      expectedFrequencyDays: 14,
      performerQualificationBasis: "Trained operator",
      active: true,
    },
    update: {},
  });

  const mobileVersion = await prisma.inspectionTemplateVersion.upsert({
    where: { templateId_version: { templateId: mobileTemplate.id, version: 1 } },
    create: {
      templateId: mobileTemplate.id,
      version: 1,
      active: true,
    },
    update: {},
  });

  await prisma.inspectionTemplateItem.upsert({
    where: { id: "seed-mob-item-1" },
    create: {
      id: "seed-mob-item-1",
      templateVersionId: mobileVersion.id,
      sequenceOrder: 1,
      prompt: "Container properly positioned on containment?",
      responseType: "boolean",
      required: true,
      failureSeverity: CorrectiveActionSeverity.MEDIUM,
      regulatoryRequirementId: requirements["MOB-001"],
      autoCreateCorrectiveAction: true,
    },
    update: {},
  });

  // === SCHEDULED INSPECTIONS & RUNS ===

  // Facility A: 2 completed, 1 upcoming
  const schedA1 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityA.id,
      templateId: bulkTemplate.id,
      assetId: dieselAst1.id,
      dueDate: daysAgo(15),
      status: "completed",
      assignedUserId: user.id,
    },
  });

  const runA1 = await prisma.inspectionRun.create({
    data: {
      scheduledInspectionId: schedA1.id,
      facilityId: facilityA.id,
      performedByUserId: user.id,
      performedByNameSnapshot: "Maria Santos",
      performedByRoleSnapshot: "FACILITY_MANAGER",
      qualificationBasis: "Trained inspector",
      performedAt: daysAgo(15),
      performedAtTimezone: "America/Los_Angeles",
      standardBasisRef: bulkTemplate.standardBasisRef,
      procedureTextSnapshot: bulkTemplate.procedureText,
      status: "completed",
      locked: true,
    },
  });

  await prisma.inspectionSignature.create({
    data: {
      inspectionRunId: runA1.id,
      signerUserId: user.id,
      signerName: "Maria Santos",
      signerRole: "FACILITY_MANAGER",
      signedAt: daysAgo(15),
      signatureData: "signed",
    },
  });

  for (const item of bulkItems) {
    await prisma.inspectionItemResult.create({
      data: {
        inspectionRunId: runA1.id,
        templateItemId: item.id,
        responseValue: true,
        pass: true,
        notes: null,
      },
    });
  }

  const schedA2 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityA.id,
      templateId: containmentTemplate.id,
      assetId: null,
      dueDate: daysAgo(10),
      status: "completed",
    },
  });

  const runA2 = await prisma.inspectionRun.create({
    data: {
      scheduledInspectionId: schedA2.id,
      facilityId: facilityA.id,
      performedByUserId: user.id,
      performedByNameSnapshot: "Maria Santos",
      performedByRoleSnapshot: "FACILITY_MANAGER",
      qualificationBasis: "Trained inspector",
      performedAt: daysAgo(10),
      performedAtTimezone: "America/Los_Angeles",
      status: "completed",
      locked: true,
    },
  });

  await prisma.inspectionSignature.create({
    data: {
      inspectionRunId: runA2.id,
      signerUserId: user.id,
      signerName: "Maria Santos",
      signerRole: "FACILITY_MANAGER",
      signedAt: daysAgo(10),
      signatureData: "signed",
    },
  });

  const schedA3 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityA.id,
      templateId: transferTemplate.id,
      assetId: loadingAreaA.id,
      dueDate: daysAhead(5),
      status: "scheduled",
    },
  });

  // Facility B: 2 overdue, 1 completed with failures
  const schedB1 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityB.id,
      templateId: bulkTemplate.id,
      assetId: dieselMainB.id,
      dueDate: daysAgo(20),
      status: "scheduled",
    },
  });

  const schedB2 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityB.id,
      templateId: transferTemplate.id,
      assetId: transferAreaB.id,
      dueDate: daysAgo(5),
      status: "scheduled",
    },
  });

  const schedB3 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityB.id,
      templateId: bulkTemplate.id,
      assetId: lubeAstB.id,
      dueDate: daysAgo(30),
      status: "completed",
    },
  });

  const runB3 = await prisma.inspectionRun.create({
    data: {
      scheduledInspectionId: schedB3.id,
      facilityId: facilityB.id,
      performedByUserId: user.id,
      performedByNameSnapshot: "James Wu",
      performedByRoleSnapshot: "FACILITY_MANAGER",
      performedAt: daysAgo(30),
      performedAtTimezone: "America/Los_Angeles",
      status: "completed",
      locked: true,
    },
  });

  await prisma.inspectionSignature.create({
    data: {
      inspectionRunId: runB3.id,
      signerUserId: user.id,
      signerName: "James Wu",
      signerRole: "FACILITY_MANAGER",
      signedAt: daysAgo(30),
      signatureData: "signed",
    },
  });

  const bulkItem1 = bulkItems[0];
  const bulkItem2 = bulkItems[1];
  await prisma.inspectionItemResult.createMany({
    data: [
      { inspectionRunId: runB3.id, templateItemId: bulkItem1.id, responseValue: true, pass: true },
      { inspectionRunId: runB3.id, templateItemId: bulkItem2.id, responseValue: false, pass: false, notes: "Minor staining observed in northwest corner" },
      { inspectionRunId: runB3.id, templateItemId: bulkItems[2].id, responseValue: true, pass: true },
    ],
  });

  const schedB4 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityB.id,
      templateId: mobileTemplate.id,
      assetId: mobileToteB1.id,
      dueDate: daysAhead(3),
      status: "scheduled",
    },
  });

  // Facility C: 1 signed, 1 unsigned, 1 overdue, 1 mobile
  const schedC1 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityC.id,
      templateId: bulkTemplate.id,
      assetId: genDieselC.id,
      dueDate: daysAgo(25),
      status: "completed",
    },
  });

  const runC1 = await prisma.inspectionRun.create({
    data: {
      scheduledInspectionId: schedC1.id,
      facilityId: facilityC.id,
      performedByUserId: user.id,
      performedByNameSnapshot: "Robert Chen",
      performedByRoleSnapshot: "FACILITY_MANAGER",
      performedAt: daysAgo(25),
      performedAtTimezone: "America/Los_Angeles",
      status: "completed",
      locked: true,
    },
  });

  await prisma.inspectionSignature.create({
    data: {
      inspectionRunId: runC1.id,
      signerUserId: user.id,
      signerName: "Robert Chen",
      signerRole: "FACILITY_MANAGER",
      signedAt: daysAgo(25),
      signatureData: "signed",
    },
  });

  for (const item of bulkItems) {
    await prisma.inspectionItemResult.create({
      data: {
        inspectionRunId: runC1.id,
        templateItemId: item.id,
        responseValue: true,
        pass: true,
      },
    });
  }

  // Unsigned completed inspection - triggers hard failure
  const schedC2 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityC.id,
      templateId: transferTemplate.id,
      assetId: loadingAreaC.id,
      dueDate: daysAgo(3),
      status: "in_progress",
    },
  });

  const runC2 = await prisma.inspectionRun.create({
    data: {
      scheduledInspectionId: schedC2.id,
      facilityId: facilityC.id,
      performedByUserId: user.id,
      performedByNameSnapshot: "Robert Chen",
      performedByRoleSnapshot: "FACILITY_MANAGER",
      performedAt: daysAgo(2),
      performedAtTimezone: "America/Los_Angeles",
      status: "completed",
      locked: false, // UNSIGNED - triggers hard failure
    },
  });

  const xferItems = await prisma.inspectionTemplateItem.findMany({
    where: { templateVersionId: transferVersion.id },
    orderBy: { sequenceOrder: "asc" },
  });
  for (const item of xferItems) {
    await prisma.inspectionItemResult.create({
      data: {
        inspectionRunId: runC2.id,
        templateItemId: item.id,
        responseValue: true,
        pass: true,
      },
    });
  }

  const schedC3 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityC.id,
      templateId: bulkTemplate.id,
      assetId: hydraulicResC.id,
      dueDate: daysAgo(10),
      status: "scheduled",
    },
  });

  const schedC4 = await prisma.scheduledInspection.create({
    data: {
      facilityId: facilityC.id,
      templateId: mobileTemplate.id,
      assetId: mobileFuelC.id,
      dueDate: daysAgo(7),
      status: "scheduled",
    },
  });

  // === CORRECTIVE ACTIONS ===

  // Facility A: 1 closed
  const caA1 = await prisma.correctiveAction.create({
    data: {
      facilityId: facilityA.id,
      assetId: dieselAst1.id,
      title: "Re-tag secondary containment drain valve controls",
      description: "Valve tags were faded. Replaced with new laminated tags indicating closed/open positions.",
      severity: CorrectiveActionSeverity.LOW,
      triggerCategory: "inspection_failure",
      ownerUserId: user.id,
      dueDate: daysAgo(30),
      status: CorrectiveActionStatus.CLOSED,
      rootCause: "Weather exposure degraded original tags",
      closureNote: "New tags installed and verified. Photo documentation attached.",
      verifiedByUserId: user.id,
      verifiedAt: daysAgo(28),
    },
  });

  await prisma.correctiveActionStatusHistory.createMany({
    data: [
      { actionId: caA1.id, fromStatus: null, toStatus: CorrectiveActionStatus.OPEN, changedByUserId: user.id },
      { actionId: caA1.id, fromStatus: CorrectiveActionStatus.OPEN, toStatus: CorrectiveActionStatus.IN_PROGRESS, changedByUserId: user.id },
      { actionId: caA1.id, fromStatus: CorrectiveActionStatus.IN_PROGRESS, toStatus: CorrectiveActionStatus.PENDING_VERIFICATION, changedByUserId: user.id },
      { actionId: caA1.id, fromStatus: CorrectiveActionStatus.PENDING_VERIFICATION, toStatus: CorrectiveActionStatus.CLOSED, changedByUserId: user.id },
    ],
  });

  // Facility B: 2 open
  const caB1 = await prisma.correctiveAction.create({
    data: {
      facilityId: facilityB.id,
      assetId: dieselMainB.id,
      title: "Repair cracked berm section near Diesel AST Main",
      description: "Crack observed in berm wall during inspection. Requires repair to maintain containment integrity.",
      severity: CorrectiveActionSeverity.HIGH,
      triggerCategory: "inspection_failure",
      ownerUserId: user.id,
      dueDate: daysAgo(5),
      status: CorrectiveActionStatus.OPEN,
    },
  });

  const caB2 = await prisma.correctiveAction.create({
    data: {
      facilityId: facilityB.id,
      assetId: transferAreaB.id,
      title: "Replace missing spill kit at transfer area",
      description: "Spill kit was empty and missing absorbent pads. Need full restock.",
      severity: CorrectiveActionSeverity.MEDIUM,
      triggerCategory: "inspection_failure",
      ownerUserId: user.id,
      dueDate: daysAgo(2),
      status: CorrectiveActionStatus.OPEN,
    },
  });

  // Facility C: 1 in progress, 1 pending verification, 1 accepted risk
  const caC1 = await prisma.correctiveAction.create({
    data: {
      facilityId: facilityC.id,
      assetId: mobileFuelC.id,
      title: "Investigate staining under mobile fuel tote",
      description: "Light staining observed during mobile container inspection. Determine source and remediate.",
      severity: CorrectiveActionSeverity.MEDIUM,
      triggerCategory: "inspection_failure",
      ownerUserId: user.id,
      dueDate: daysAhead(7),
      status: CorrectiveActionStatus.IN_PROGRESS,
      rootCause: "Minor drip from transfer hose connection. Fitting tightened.",
    },
  });

  const caC2 = await prisma.correctiveAction.create({
    data: {
      facilityId: facilityC.id,
      assetId: hydraulicResC.id,
      title: "Verify hydraulic reservoir overflow routing",
      description: "Document overflow drain path and ensure no pathway to storm system.",
      severity: CorrectiveActionSeverity.LOW,
      triggerCategory: "audit",
      ownerUserId: user.id,
      dueDate: daysAgo(1),
      status: CorrectiveActionStatus.PENDING_VERIFICATION,
      rootCause: "Routine audit finding",
      closureNote: "Routing verified. Overflow discharges to contained sump.",
    },
  });

  const caC3 = await prisma.correctiveAction.create({
    data: {
      facilityId: facilityC.id,
      assetId: null,
      title: "Deferred: Upgrade secondary containment capacity calculation",
      description: "Current calculation method is acceptable per PE review. Full upgrade deferred to next 5-year review.",
      severity: CorrectiveActionSeverity.LOW,
      triggerCategory: "audit",
      ownerUserId: user.id,
      dueDate: daysAhead(365),
      status: CorrectiveActionStatus.ACCEPTED_RISK,
      acceptedRiskJustification: "PE reviewed and confirmed existing method meets 40 CFR 112.7(c). Documented for next plan review cycle. Risk accepted with monitoring.",
    },
  });

  // === PERSONNEL ===

  const personnelA = await Promise.all([
    prisma.personnel.create({
      data: {
        facilityId: facilityA.id,
        name: "Maria Santos",
        email: "msantos@northvalleyfleet.com",
        roleTitle: "Facility Manager",
        oilHandlingPersonnel: true,
        hireDate: daysAgo(365 * 3),
      },
    }),
    prisma.personnel.create({
      data: {
        facilityId: facilityA.id,
        name: "Carlos Mendez",
        email: "cmendez@northvalleyfleet.com",
        roleTitle: "Inspector / Operator",
        oilHandlingPersonnel: true,
        hireDate: daysAgo(365),
      },
    }),
  ]);

  const personnelB = await Promise.all([
    prisma.personnel.create({
      data: {
        facilityId: facilityB.id,
        name: "James Wu",
        email: "jwu@centralequipment.com",
        roleTitle: "Operations Manager",
        oilHandlingPersonnel: true,
        hireDate: daysAgo(365 * 2),
      },
    }),
    prisma.personnel.create({
      data: {
        facilityId: facilityB.id,
        name: "Amy Torres",
        email: "atorres@centralequipment.com",
        roleTitle: "Equipment Operator",
        oilHandlingPersonnel: true,
        hireDate: daysAgo(180),
      },
    }),
  ]);

  const personnelC = await Promise.all([
    prisma.personnel.create({
      data: {
        facilityId: facilityC.id,
        name: "Robert Chen",
        email: "rchen@eastmfg.com",
        roleTitle: "Plant Manager",
        oilHandlingPersonnel: true,
        hireDate: daysAgo(365 * 4),
      },
    }),
    prisma.personnel.create({
      data: {
        facilityId: facilityC.id,
        name: "Linda Park",
        email: "lpark@eastmfg.com",
        roleTitle: "Maintenance Lead",
        oilHandlingPersonnel: true,
        hireDate: daysAgo(365 * 2),
      },
    }),
  ]);

  // === TRAINING EVENTS ===

  // Facility A: recent annual briefing
  const trainA1 = await prisma.trainingEvent.create({
    data: {
      facilityId: facilityA.id,
      type: TrainingEventType.ANNUAL_BRIEFING,
      eventDate: daysAgo(60),
      instructorName: "Maria Santos",
      agenda: "SPCC overview, spill response, inspection procedures, accountability",
    },
  });

  for (const p of personnelA) {
    await prisma.trainingAttendance.create({
      data: { eventId: trainA1.id, personnelId: p.id, attended: true },
    });
  }

  const trainA2 = await prisma.trainingEvent.create({
    data: {
      facilityId: facilityA.id,
      type: TrainingEventType.ONBOARDING,
      eventDate: daysAgo(300),
      instructorName: "Maria Santos",
      agenda: "New hire SPCC orientation",
    },
  });

  await prisma.trainingAttendance.create({
    data: { eventId: trainA2.id, personnelId: personnelA[1].id, attended: true },
  });

  // Facility B: annual briefing due soon (old)
  const trainB1 = await prisma.trainingEvent.create({
    data: {
      facilityId: facilityB.id,
      type: TrainingEventType.ANNUAL_BRIEFING,
      eventDate: daysAgo(340),
      instructorName: "James Wu",
      agenda: "SPCC annual refresher",
    },
  });

  await prisma.trainingAttendance.create({
    data: { eventId: trainB1.id, personnelId: personnelB[0].id, attended: true },
  });
  await prisma.trainingAttendance.create({
    data: { eventId: trainB1.id, personnelId: personnelB[1].id, attended: false },
  });

  // Facility C: recent remedial
  const trainC1 = await prisma.trainingEvent.create({
    data: {
      facilityId: facilityC.id,
      type: TrainingEventType.REMEDIAL,
      eventDate: daysAgo(45),
      instructorName: "Robert Chen",
      agenda: "Spill response retraining following incident",
      linkedIncidentIds: '["INC-2024-003"]',
    },
  });

  for (const p of personnelC) {
    await prisma.trainingAttendance.create({
      data: { eventId: trainC1.id, personnelId: p.id, attended: true },
    });
  }

  const trainC2 = await prisma.trainingEvent.create({
    data: {
      facilityId: facilityC.id,
      type: TrainingEventType.ANNUAL_BRIEFING,
      eventDate: daysAgo(200),
      instructorName: "Robert Chen",
      agenda: "Annual SPCC briefing",
    },
  });

  for (const p of personnelC) {
    await prisma.trainingAttendance.create({
      data: { eventId: trainC2.id, personnelId: p.id, attended: true },
    });
  }

  // === OBLIGATIONS ===

  await prisma.obligationRecord.createMany({
    data: [
      { facilityId: facilityA.id, requirementCode: "SCHED-001", obligationType: ObligationType.INSPECTION_DUE, sourceObjectType: "ScheduledInspection", sourceObjectId: schedA3.id, severity: ValidationSeverity.AT_RISK, status: "open", dueDate: daysAhead(5) },
      { facilityId: facilityB.id, requirementCode: "SCHED-001", obligationType: ObligationType.INSPECTION_OVERDUE, sourceObjectType: "ScheduledInspection", sourceObjectId: schedB1.id, severity: ValidationSeverity.HARD_FAILURE, status: "open", dueDate: daysAgo(20) },
      { facilityId: facilityB.id, requirementCode: "SCHED-001", obligationType: ObligationType.INSPECTION_OVERDUE, sourceObjectType: "ScheduledInspection", sourceObjectId: schedB2.id, severity: ValidationSeverity.HARD_FAILURE, status: "open", dueDate: daysAgo(5) },
      { facilityId: facilityB.id, requirementCode: "CA-001", obligationType: ObligationType.ACTION_OVERDUE, sourceObjectType: "CorrectiveAction", sourceObjectId: caB1.id, severity: ValidationSeverity.HARD_FAILURE, status: "open", dueDate: daysAgo(5) },
      { facilityId: facilityB.id, requirementCode: "CA-001", obligationType: ObligationType.ACTION_OVERDUE, sourceObjectType: "CorrectiveAction", sourceObjectId: caB2.id, severity: ValidationSeverity.HARD_FAILURE, status: "open", dueDate: daysAgo(2) },
      { facilityId: facilityB.id, requirementCode: "TRAIN-001", obligationType: ObligationType.TRAINING_DUE, sourceObjectType: "TrainingEvent", sourceObjectId: trainB1.id, severity: ValidationSeverity.AT_RISK, status: "open", dueDate: daysAhead(25) },
      { facilityId: facilityC.id, requirementCode: "INSP-001", obligationType: ObligationType.SIGNATURE_MISSING, sourceObjectType: "InspectionRun", sourceObjectId: runC2.id, severity: ValidationSeverity.HARD_FAILURE, status: "open", dueDate: daysAgo(2) },
      { facilityId: facilityC.id, requirementCode: "SCHED-001", obligationType: ObligationType.INSPECTION_OVERDUE, sourceObjectType: "ScheduledInspection", sourceObjectId: schedC3.id, severity: ValidationSeverity.HARD_FAILURE, status: "open", dueDate: daysAgo(10) },
      { facilityId: facilityC.id, requirementCode: "CA-001", obligationType: ObligationType.ACTION_OVERDUE, sourceObjectType: "CorrectiveAction", sourceObjectId: caC2.id, severity: ValidationSeverity.AT_RISK, status: "open", dueDate: daysAgo(1) },
    ],
  });

  // === VALIDATION RESULTS ===

  await prisma.validationResult.createMany({
    data: [
      {
        facilityId: facilityA.id,
        hardFailures: [],
        riskFlags: [{ code: "INCOMPLETE_TEMPLATE_BASIS", message: "Some templates have incomplete basis" }],
        overallStatus: "AT_RISK",
      },
      {
        facilityId: facilityB.id,
        hardFailures: [
          { code: "ASSET_REQUIRES_CONTAINMENT", message: "Asset USED-OIL-TANK requires sized containment but none linked", sourceObjectType: "Asset", sourceObjectId: usedOilTankB.id },
          { code: "INSPECTION_OVERDUE", message: "Inspections overdue" },
        ],
        riskFlags: [
          { code: "MISSING_NARRATIVE", message: "Discharge narrative could be expanded" },
          { code: "INCOMPLETE_TEMPLATE_BASIS", message: "Containment template basis incomplete" },
        ],
        overallStatus: "NONCOMPLIANT",
      },
      {
        facilityId: facilityC.id,
        hardFailures: [
          { code: "UNSIGNED_INSPECTION", message: "Completed inspection awaiting signature", sourceObjectType: "InspectionRun", sourceObjectId: runC2.id },
          { code: "ASSET_REQUIRES_CONTAINMENT", message: "Asset XFMR-OIL-1 requires sized containment but none linked", sourceObjectType: "Asset", sourceObjectId: transformerC.id },
        ],
        riskFlags: [
          { code: "INCONSISTENT_ASSET_CLASS", message: "Some assets missing asset class" },
          { code: "INCOMPLETE_TEMPLATE_BASIS", message: "Template basis incomplete" },
        ],
        overallStatus: "NONCOMPLIANT",
      },
    ],
  });

  // === FILE ATTACHMENTS ===

  const uploadDir = await ensureUploadDir();
  const createFile = async (
    facilityId: string,
    objectType: "FACILITY" | "ASSET" | "CONTAINMENT_UNIT" | "INSPECTION_RUN" | "CORRECTIVE_ACTION" | "TRAINING_EVENT",
    objectId: string,
    fileName: string
  ) => {
    const storageKey = `seed-${objectType}-${objectId}-${Date.now()}.txt`;
    const content = `Placeholder: ${fileName}\nSeed created ${now.toISOString()}`;
    await fs.promises.writeFile(path.join(uploadDir, storageKey), content);
    return prisma.fileAsset.create({
      data: {
        facilityId,
        objectType,
        objectId,
        fileName,
        mimeType: "text/plain",
        storageKey,
        checksum: "seed",
        uploadedByUserId: user.id,
      },
    });
  };

  await createFile(facilityA.id, "FACILITY", facilityA.id, "SPCC_Plan_North_Valley.pdf");
  await createFile(facilityA.id, "ASSET", dieselAst1.id, "Diesel_AST_1_photo.jpg");
  await createFile(facilityA.id, "CONTAINMENT_UNIT", containmentA.id, "Berm_capacity_calc.pdf");
  await createFile(facilityA.id, "INSPECTION_RUN", runA1.id, "Inspection_evidence_001.jpg");
  await createFile(facilityA.id, "CORRECTIVE_ACTION", caA1.id, "Valve_tag_closure_photo.jpg");
  await createFile(facilityA.id, "TRAINING_EVENT", trainA1.id, "Annual_briefing_agenda.pdf");

  await createFile(facilityB.id, "FACILITY", facilityB.id, "SPCC_Plan_Central.pdf");
  await createFile(facilityB.id, "ASSET", dieselMainB.id, "Diesel_Main_photo.jpg");

  await createFile(facilityC.id, "FACILITY", facilityC.id, "SPCC_Plan_East.pdf");
  await createFile(facilityC.id, "ASSET", genDieselC.id, "Generator_tank_photo.jpg");
  await createFile(facilityC.id, "INSPECTION_RUN", runC1.id, "Inspection_photo.jpg");

  // === PHASE 3: PLANS, INCIDENTS, REVIEWS, AMENDMENTS ===

  const PLAN_SECTION_KEYS = ["APPLICABILITY", "FACILITY_INFORMATION", "FACILITY_DIAGRAM_AND_ATTACHMENTS", "OIL_STORAGE_INVENTORY", "SPILL_HISTORY", "SECONDARY_CONTAINMENT", "INSPECTION_AND_TESTING_PROCEDURES", "LOADING_UNLOADING_CONTROLS", "SECURITY_MEASURES", "PERSONNEL_AND_TRAINING", "EMERGENCY_CONTACTS_AND_RESPONSE_NOTES", "AMENDMENT_LOG", "ATTACHMENTS"];
  const PLAN_SECTION_TITLES: Record<string, string> = {
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

  async function seedPlanForFacility(facilityId: string, facilityName: string, approve = true) {
    const plan = await prisma.plan.upsert({
      where: { facilityId },
      create: { facilityId },
      update: {},
    });
    const version = await prisma.planVersion.create({
      data: {
        planId: plan.id,
        facilityId,
        versionNumber: 1,
        status: approve ? PlanStatus.APPROVED : PlanStatus.DRAFT,
        qualificationTierSnapshot: "TIER_I",
        certificationType: approve ? PlanCertificationType.OWNER_OPERATOR_SELF_CERTIFIED : null,
        effectiveDate: approve ? daysAgo(90) : null,
        createdByUserId: user.id,
        approvedByUserId: approve ? user.id : null,
      },
    });
    for (let i = 0; i < PLAN_SECTION_KEYS.length; i++) {
      const key = PLAN_SECTION_KEYS[i];
      await prisma.planSection.create({
        data: {
          planVersionId: version.id,
          sectionKey: key,
          title: PLAN_SECTION_TITLES[key] ?? key.replace(/_/g, " "),
          sectionOrder: i + 1,
          contentMode: "NARRATIVE",
          narrativeText: `Sample narrative for ${PLAN_SECTION_TITLES[key]} at ${facilityName}. This section would contain facility-specific content.`,
          generatedFromSystem: ["OIL_STORAGE_INVENTORY", "SPILL_HISTORY", "SECONDARY_CONTAINMENT"].includes(key),
        },
      });
    }
    if (approve) {
      await prisma.planCertification.create({
        data: {
          planVersionId: version.id,
          certificationType: PlanCertificationType.OWNER_OPERATOR_SELF_CERTIFIED,
          certifiedByName: "Demo Manager",
          certifiedByTitle: "Facility Manager",
          certificationDate: daysAgo(90),
          siteVisitDate: daysAgo(95),
          notes: "Self-certified for demo purposes.",
        },
      });
      await prisma.plan.update({ where: { id: plan.id }, data: { currentVersionId: version.id } });
    }
    return { plan, version };
  }

  const { version: planVersionA } = await seedPlanForFacility(facilityA.id, "North Valley Fleet Depot", true);
  await seedPlanForFacility(facilityB.id, "Central Equipment Yard", true);
  await seedPlanForFacility(facilityC.id, "East Manufacturing Site", false);

  await prisma.incident.create({
    data: {
      facilityId: facilityA.id,
      sourceAssetId: dieselAst1.id,
      title: "Minor diesel drip from valve",
      occurredAt: daysAgo(120),
      estimatedTotalSpilledGallons: 0.5,
      estimatedAmountToWaterGallons: 0,
      cause: "Worn valve gasket",
      immediateActions: "Contained with absorbent. Valve repaired same day.",
      severity: IncidentSeverity.LOW,
      createdByUserId: user.id,
    },
  });

  await prisma.incident.create({
    data: {
      facilityId: facilityB.id,
      title: "Hydraulic fluid leak during maintenance",
      occurredAt: daysAgo(45),
      estimatedTotalSpilledGallons: 2,
      estimatedAmountToWaterGallons: 0,
      impactedWaterbody: "None",
      cause: "Hose failure during equipment service",
      immediateActions: "Absorbent pads applied. Area contained.",
      severity: IncidentSeverity.MEDIUM,
      createdByUserId: user.id,
    },
  });

  await prisma.planReview.create({
    data: {
      facilityId: facilityA.id,
      planVersionId: planVersionA.id,
      dueDate: daysAhead(365),
      status: ReviewStatus.UPCOMING,
    },
  });

  await prisma.planAmendment.create({
    data: {
      facilityId: facilityA.id,
      planVersionId: planVersionA.id,
      amendmentType: AmendmentType.ASSET_CHANGE,
      description: "Added new diesel storage tank to inventory.",
      status: AmendmentStatus.IMPLEMENTED,
      createdByUserId: user.id,
      completedAt: daysAgo(30),
      implementedBy: user.id,
    },
  });

  // Remove old Main Site if it exists from original seed (optional - keep for backward compat)
  const oldMainSite = await prisma.facility.findFirst({
    where: { organizationId: org.id, slug: "main-site" },
  });
  if (oldMainSite) {
    await prisma.facilityMembership.upsert({
      where: { facilityId_userId: { facilityId: oldMainSite.id, userId: user.id } },
      create: { facilityId: oldMainSite.id, userId: user.id, role: UserRole.FACILITY_MANAGER },
      update: {},
    });
  }

  console.log(`
Seed complete!

Login: seed@containpoint.com
Password: Seed1234!

Facilities created:
- North Valley Fleet Depot (mostly healthy)
- Central Equipment Yard (at risk)
- East Manufacturing Site (mixed/complex)
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
