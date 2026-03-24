-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "PlanCertificationType" AS ENUM ('OWNER_OPERATOR_SELF_CERTIFIED', 'PE_CERTIFIED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('UPCOMING', 'DUE', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "AmendmentType" AS ENUM ('FIVE_YEAR_REVIEW', 'ASSET_CHANGE', 'OWNERSHIP_CHANGE', 'INCIDENT', 'PROCEDURAL_CHANGE', 'CONSULTANT_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "AmendmentStatus" AS ENUM ('OPEN', 'DRAFTING', 'READY_FOR_APPROVAL', 'IMPLEMENTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TechnicalChangeType" AS ENUM ('TECHNICAL', 'NON_TECHNICAL');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('PLAN_PDF', 'INSPECTION_REPORT', 'CORRECTIVE_ACTION_REGISTER', 'TRAINING_LOG', 'CONTAINER_INVENTORY', 'CONTAINMENT_BASIS', 'REVIEW_MEMO', 'INCIDENT_LOG', 'FULL_AUDIT_PACK');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "FileObjectType" ADD VALUE 'INCIDENT';

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanVersion" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "PlanStatus" NOT NULL,
    "qualificationTierSnapshot" TEXT,
    "certificationType" "PlanCertificationType",
    "effectiveDate" TIMESTAMP(3),
    "supersededDate" TIMESTAMP(3),
    "reviewDueDate" TIMESTAMP(3),
    "generatedDocumentPath" TEXT,
    "lockedSnapshotJson" JSONB,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSection" (
    "id" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sectionOrder" INTEGER NOT NULL,
    "contentMode" TEXT NOT NULL,
    "structuredDataJson" JSONB,
    "narrativeText" TEXT,
    "generatedFromSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSectionRevision" (
    "id" TEXT NOT NULL,
    "planSectionId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "editedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanSectionRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanCertification" (
    "id" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "certificationType" "PlanCertificationType" NOT NULL,
    "certifiedByName" TEXT NOT NULL,
    "certifiedByTitle" TEXT,
    "certificationDate" TIMESTAMP(3) NOT NULL,
    "siteVisitDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanReview" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "status" "ReviewStatus" NOT NULL,
    "summary" TEXT,
    "requiresAmendment" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanAmendment" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "planVersionId" TEXT,
    "amendmentType" "AmendmentType" NOT NULL,
    "technicalChangeType" "TechnicalChangeType",
    "description" TEXT NOT NULL,
    "dueBy" TIMESTAMP(3),
    "implementedBy" TEXT,
    "status" "AmendmentStatus" NOT NULL,
    "affectedSectionsJson" TEXT,
    "requiresPe" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "sourceAssetId" TEXT,
    "title" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "estimatedTotalSpilledGallons" DOUBLE PRECISION,
    "estimatedAmountToWaterGallons" DOUBLE PRECISION,
    "impactedWaterbody" TEXT,
    "cause" TEXT,
    "immediateActions" TEXT,
    "notes" TEXT,
    "severity" "IncidentSeverity" NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentFile" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "exportType" "ExportType" NOT NULL,
    "status" "ExportStatus" NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "parametersJson" JSONB,

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportArtifact" (
    "id" TEXT NOT NULL,
    "exportJobId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "ExportArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_facilityId_key" ON "Plan"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_currentVersionId_key" ON "Plan"("currentVersionId");

-- CreateIndex
CREATE INDEX "Plan_facilityId_idx" ON "Plan"("facilityId");

-- CreateIndex
CREATE INDEX "PlanVersion_facilityId_idx" ON "PlanVersion"("facilityId");

-- CreateIndex
CREATE INDEX "PlanVersion_status_idx" ON "PlanVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PlanVersion_planId_versionNumber_key" ON "PlanVersion"("planId", "versionNumber");

-- CreateIndex
CREATE INDEX "PlanSection_planVersionId_idx" ON "PlanSection"("planVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanSection_planVersionId_sectionKey_key" ON "PlanSection"("planVersionId", "sectionKey");

-- CreateIndex
CREATE INDEX "PlanSectionRevision_planSectionId_idx" ON "PlanSectionRevision"("planSectionId");

-- CreateIndex
CREATE INDEX "PlanCertification_planVersionId_idx" ON "PlanCertification"("planVersionId");

-- CreateIndex
CREATE INDEX "PlanReview_facilityId_idx" ON "PlanReview"("facilityId");

-- CreateIndex
CREATE INDEX "PlanReview_planVersionId_idx" ON "PlanReview"("planVersionId");

-- CreateIndex
CREATE INDEX "PlanReview_status_idx" ON "PlanReview"("status");

-- CreateIndex
CREATE INDEX "PlanAmendment_facilityId_idx" ON "PlanAmendment"("facilityId");

-- CreateIndex
CREATE INDEX "PlanAmendment_status_idx" ON "PlanAmendment"("status");

-- CreateIndex
CREATE INDEX "Incident_facilityId_idx" ON "Incident"("facilityId");

-- CreateIndex
CREATE INDEX "Incident_occurredAt_idx" ON "Incident"("occurredAt");

-- CreateIndex
CREATE INDEX "IncidentFile_incidentId_idx" ON "IncidentFile"("incidentId");

-- CreateIndex
CREATE INDEX "ExportJob_facilityId_idx" ON "ExportJob"("facilityId");

-- CreateIndex
CREATE INDEX "ExportJob_status_idx" ON "ExportJob"("status");

-- CreateIndex
CREATE INDEX "ExportArtifact_exportJobId_idx" ON "ExportArtifact"("exportJobId");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "PlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSection" ADD CONSTRAINT "PlanSection_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSectionRevision" ADD CONSTRAINT "PlanSectionRevision_planSectionId_fkey" FOREIGN KEY ("planSectionId") REFERENCES "PlanSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCertification" ADD CONSTRAINT "PlanCertification_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanReview" ADD CONSTRAINT "PlanReview_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanReview" ADD CONSTRAINT "PlanReview_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAmendment" ADD CONSTRAINT "PlanAmendment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAmendment" ADD CONSTRAINT "PlanAmendment_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentFile" ADD CONSTRAINT "IncidentFile_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportArtifact" ADD CONSTRAINT "ExportArtifact_exportJobId_fkey" FOREIGN KEY ("exportJobId") REFERENCES "ExportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
