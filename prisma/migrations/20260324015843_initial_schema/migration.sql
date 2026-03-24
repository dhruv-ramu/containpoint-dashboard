-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ORG_ADMIN', 'FACILITY_MANAGER', 'INSPECTOR', 'REVIEWER', 'READ_ONLY_AUDITOR');

-- CreateEnum
CREATE TYPE "FacilityStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicabilityStatus" AS ENUM ('NOT_ASSESSED', 'APPLICABLE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "QualificationTier" AS ENUM ('NOT_QUALIFIED', 'TIER_I', 'TIER_II', 'PE_CERTIFIED_ONLY');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('BULK_STORAGE_CONTAINER', 'DRUM_TOTE', 'TRANSFORMER', 'MOBILE_CONTAINER', 'LOADING_UNLOADING_AREA', 'TRANSFER_AREA', 'OTHER');

-- CreateEnum
CREATE TYPE "OilTypeCategory" AS ENUM ('DIESEL', 'GASOLINE', 'HYDRAULIC', 'LUBE', 'USED_OIL', 'TRANSFORMER', 'CRUDE', 'OTHER');

-- CreateEnum
CREATE TYPE "ContainmentType" AS ENUM ('DIKE_BERM', 'PALLET', 'BUILDING_FLOOR', 'SUMP', 'DOUBLE_WALL', 'OTHER');

-- CreateEnum
CREATE TYPE "FileObjectType" AS ENUM ('FACILITY', 'ASSET', 'CONTAINMENT_UNIT');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "ConditionStatus" AS ENUM ('GOOD', 'FAIR', 'POOR', 'REQUIRES_ATTENTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "FacilityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityMembership" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityProfile" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "legalName" TEXT,
    "dbaName" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'US',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "naicsCode" TEXT,
    "industry" TEXT,
    "dischargeExpectationNarrative" TEXT,
    "nearestWaterbody" TEXT,
    "operatingHours" TEXT,
    "consultantOfRecord" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "currentPlanEffectiveDate" TIMESTAMP(3),
    "nextFiveYearReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityApplicabilityAssessment" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "nonTransportationRelated" BOOLEAN NOT NULL,
    "aggregateAbovegroundCapacityGallons" INTEGER NOT NULL,
    "completelyBuriedCapacityGallons" INTEGER NOT NULL,
    "hasReasonableExpectationOfDischarge" BOOLEAN NOT NULL,
    "hasContainersBelow55Excluded" BOOLEAN NOT NULL,
    "hasPermanentlyClosedContainersExcluded" BOOLEAN NOT NULL,
    "hasMotivePowerContainersExcluded" BOOLEAN NOT NULL,
    "hasWastewaterTreatmentExclusions" BOOLEAN NOT NULL,
    "spccApplicable" BOOLEAN NOT NULL,
    "notes" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL,
    "assessedByUserId" TEXT NOT NULL,

    CONSTRAINT "FacilityApplicabilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityQualificationRecord" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "qualifiedFacility" BOOLEAN NOT NULL,
    "tier" "QualificationTier" NOT NULL,
    "maxIndividualContainerGallons" INTEGER,
    "singleDischargeGt1000Last3Years" BOOLEAN NOT NULL,
    "twoDischargesGt42Within12MonthsLast3Years" BOOLEAN NOT NULL,
    "qualificationRationale" TEXT,
    "v1Fit" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL,
    "assessedByUserId" TEXT NOT NULL,

    CONSTRAINT "FacilityQualificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityAccountablePerson" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "appointedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityAccountablePerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OilType" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "OilTypeCategory" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OilType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "oilTypeId" TEXT,
    "storageCapacityGallons" INTEGER,
    "typicalFillPercent" INTEGER,
    "countedTowardThreshold" BOOLEAN NOT NULL DEFAULT true,
    "exclusionReason" TEXT,
    "aboveground" BOOLEAN NOT NULL DEFAULT true,
    "indoor" BOOLEAN,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "installDate" TIMESTAMP(3),
    "retirementDate" TIMESTAMP(3),
    "manufacturer" TEXT,
    "material" TEXT,
    "dimensions" TEXT,
    "overfillProtectionNotes" TEXT,
    "integrityTestingBasis" TEXT,
    "inspectionFrequencyDays" INTEGER,
    "lastInspectionDate" TIMESTAMP(3),
    "nextInspectionDate" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainmentUnit" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "containmentType" "ContainmentType" NOT NULL,
    "largestSingleTankCapacityGallons" INTEGER,
    "capacityCalculationMethod" TEXT,
    "calculatedCapacityGallons" INTEGER,
    "drainageControlNotes" TEXT,
    "conditionStatus" "ConditionStatus",
    "lastInspectionDate" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContainmentUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetContainmentLink" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "containmentUnitId" TEXT NOT NULL,

    CONSTRAINT "AssetContainmentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferArea" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "drainageControls" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "objectType" "FileObjectType" NOT NULL,
    "objectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksum" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caption" TEXT,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "facilityId" TEXT,
    "actorUserId" TEXT,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_idx" ON "OrganizationMembership"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_userId_organizationId_key" ON "OrganizationMembership"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "Facility_organizationId_idx" ON "Facility"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_organizationId_slug_key" ON "Facility"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "FacilityMembership_facilityId_idx" ON "FacilityMembership"("facilityId");

-- CreateIndex
CREATE INDEX "FacilityMembership_userId_idx" ON "FacilityMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityMembership_facilityId_userId_key" ON "FacilityMembership"("facilityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityProfile_facilityId_key" ON "FacilityProfile"("facilityId");

-- CreateIndex
CREATE INDEX "FacilityApplicabilityAssessment_facilityId_idx" ON "FacilityApplicabilityAssessment"("facilityId");

-- CreateIndex
CREATE INDEX "FacilityQualificationRecord_facilityId_idx" ON "FacilityQualificationRecord"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityAccountablePerson_facilityId_key" ON "FacilityAccountablePerson"("facilityId");

-- CreateIndex
CREATE INDEX "Asset_facilityId_idx" ON "Asset"("facilityId");

-- CreateIndex
CREATE INDEX "Asset_oilTypeId_idx" ON "Asset"("oilTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_facilityId_assetCode_key" ON "Asset"("facilityId", "assetCode");

-- CreateIndex
CREATE INDEX "ContainmentUnit_facilityId_idx" ON "ContainmentUnit"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "ContainmentUnit_facilityId_code_key" ON "ContainmentUnit"("facilityId", "code");

-- CreateIndex
CREATE INDEX "AssetContainmentLink_containmentUnitId_idx" ON "AssetContainmentLink"("containmentUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetContainmentLink_assetId_containmentUnitId_key" ON "AssetContainmentLink"("assetId", "containmentUnitId");

-- CreateIndex
CREATE INDEX "TransferArea_facilityId_idx" ON "TransferArea"("facilityId");

-- CreateIndex
CREATE INDEX "FileAsset_facilityId_idx" ON "FileAsset"("facilityId");

-- CreateIndex
CREATE INDEX "FileAsset_objectType_objectId_idx" ON "FileAsset"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_idx" ON "AuditEvent"("organizationId");

-- CreateIndex
CREATE INDEX "AuditEvent_facilityId_idx" ON "AuditEvent"("facilityId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_idx" ON "AuditEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityMembership" ADD CONSTRAINT "FacilityMembership_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityMembership" ADD CONSTRAINT "FacilityMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityProfile" ADD CONSTRAINT "FacilityProfile_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityApplicabilityAssessment" ADD CONSTRAINT "FacilityApplicabilityAssessment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityApplicabilityAssessment" ADD CONSTRAINT "FacilityApplicabilityAssessment_assessedByUserId_fkey" FOREIGN KEY ("assessedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityQualificationRecord" ADD CONSTRAINT "FacilityQualificationRecord_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityQualificationRecord" ADD CONSTRAINT "FacilityQualificationRecord_assessedByUserId_fkey" FOREIGN KEY ("assessedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityAccountablePerson" ADD CONSTRAINT "FacilityAccountablePerson_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_oilTypeId_fkey" FOREIGN KEY ("oilTypeId") REFERENCES "OilType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainmentUnit" ADD CONSTRAINT "ContainmentUnit_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetContainmentLink" ADD CONSTRAINT "AssetContainmentLink_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetContainmentLink" ADD CONSTRAINT "AssetContainmentLink_containmentUnitId_fkey" FOREIGN KEY ("containmentUnitId") REFERENCES "ContainmentUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferArea" ADD CONSTRAINT "TransferArea_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
