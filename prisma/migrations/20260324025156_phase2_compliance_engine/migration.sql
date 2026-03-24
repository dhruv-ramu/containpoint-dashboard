-- CreateEnum
CREATE TYPE "RequirementSourceType" AS ENUM ('REGULATION', 'GUIDANCE', 'INTERPRETATION', 'ENFORCEMENT_EXAMPLE');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('VISUAL', 'FORMAL_VISUAL', 'INTEGRITY_TEST', 'LEAK_TEST', 'DRAINAGE_RELEASE_CHECK', 'OVERFILL_DEVICE_TEST', 'PREVENTIVE_MAINTENANCE');

-- CreateEnum
CREATE TYPE "AssetClass" AS ENUM ('BULK_STORAGE_CONTAINER', 'CONTAINMENT_UNIT', 'TRANSFER_AREA', 'PIPING', 'MOBILE_PORTABLE_CONTAINER', 'FACILITY_AREA');

-- CreateEnum
CREATE TYPE "AssetModeState" AS ENUM ('STATIONARY_UNATTENDED', 'ACTIVE_TRANSFER_UNDER_CONTROL');

-- CreateEnum
CREATE TYPE "CorrectiveActionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CorrectiveActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED', 'ACCEPTED_RISK');

-- CreateEnum
CREATE TYPE "ObligationType" AS ENUM ('INSPECTION_DUE', 'INSPECTION_OVERDUE', 'ACTION_OVERDUE', 'TRAINING_DUE', 'REVIEW_DUE', 'SIGNATURE_MISSING');

-- CreateEnum
CREATE TYPE "ValidationSeverity" AS ENUM ('HARD_FAILURE', 'AT_RISK');

-- CreateEnum
CREATE TYPE "TrainingEventType" AS ENUM ('ONBOARDING', 'ANNUAL_BRIEFING', 'REMEDIAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FileObjectType" ADD VALUE 'INSPECTION_RUN';
ALTER TYPE "FileObjectType" ADD VALUE 'CORRECTIVE_ACTION';
ALTER TYPE "FileObjectType" ADD VALUE 'TRAINING_EVENT';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "assetClass" "AssetClass",
ADD COLUMN     "containmentValidationBasis" TEXT,
ADD COLUMN     "modeState" "AssetModeState",
ADD COLUMN     "requiresSizedContainment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "underDirectControl" BOOLEAN;

-- CreateTable
CREATE TABLE "RegulatoryRequirement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requirementCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" "RequirementSourceType" NOT NULL,
    "citationRef" TEXT,
    "controllingSection" TEXT,
    "summary" TEXT,
    "evidenceRequirementsJson" JSONB,
    "severityModel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulatoryRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT,
    "name" TEXT NOT NULL,
    "assetClass" "AssetClass" NOT NULL,
    "inspectionType" "InspectionType" NOT NULL,
    "standardBasisRef" TEXT,
    "procedureText" TEXT,
    "expectedFrequencyDays" INTEGER,
    "performerQualificationBasis" TEXT,
    "requiredEvidenceTypes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTemplateItem" (
    "id" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "acceptableRange" TEXT,
    "failureSeverity" "CorrectiveActionSeverity",
    "regulatoryRequirementId" TEXT,
    "autoCreateCorrectiveAction" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledInspection" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "assetId" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "recurrenceRule" TEXT,
    "assignedUserId" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionRun" (
    "id" TEXT NOT NULL,
    "scheduledInspectionId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByNameSnapshot" TEXT NOT NULL,
    "performedByRoleSnapshot" TEXT NOT NULL,
    "qualificationBasis" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "performedAtTimezone" TEXT,
    "standardBasisRef" TEXT,
    "procedureTextSnapshot" TEXT,
    "status" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionItemResult" (
    "id" TEXT NOT NULL,
    "inspectionRunId" TEXT NOT NULL,
    "templateItemId" TEXT NOT NULL,
    "responseValue" JSONB,
    "pass" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionItemResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionSignature" (
    "id" TEXT NOT NULL,
    "inspectionRunId" TEXT NOT NULL,
    "signerUserId" TEXT,
    "signerName" TEXT NOT NULL,
    "signerRole" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "signatureData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "assetId" TEXT,
    "regulatoryRequirementId" TEXT,
    "sourceInspectionItemId" TEXT,
    "sourceInspectionRunId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "CorrectiveActionSeverity" NOT NULL,
    "triggerCategory" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "CorrectiveActionStatus" NOT NULL DEFAULT 'OPEN',
    "rootCause" TEXT,
    "closureNote" TEXT,
    "acceptedRiskJustification" TEXT,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveActionComment" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorrectiveActionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveActionEvidence" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "fileId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorrectiveActionEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveActionStatusHistory" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "fromStatus" "CorrectiveActionStatus",
    "toStatus" "CorrectiveActionStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedByUserId" TEXT,

    CONSTRAINT "CorrectiveActionStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personnel" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "roleTitle" TEXT,
    "oilHandlingPersonnel" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "hireDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEvent" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "type" "TrainingEventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "instructorName" TEXT,
    "agenda" TEXT,
    "linkedIncidentIds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "userId" TEXT,
    "attended" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSignature" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "signatureData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligationRecord" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "requirementCode" TEXT NOT NULL,
    "obligationType" "ObligationType" NOT NULL,
    "sourceObjectType" TEXT NOT NULL,
    "sourceObjectId" TEXT,
    "severity" "ValidationSeverity" NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "satisfiedAt" TIMESTAMP(3),
    "evidenceObjectType" TEXT,
    "evidenceObjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObligationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationResult" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hardFailures" JSONB NOT NULL,
    "riskFlags" JSONB NOT NULL,
    "overallStatus" TEXT NOT NULL,

    CONSTRAINT "ValidationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegulatoryRequirement_organizationId_idx" ON "RegulatoryRequirement"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryRequirement_organizationId_requirementCode_key" ON "RegulatoryRequirement"("organizationId", "requirementCode");

-- CreateIndex
CREATE INDEX "InspectionTemplate_organizationId_idx" ON "InspectionTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "InspectionTemplate_facilityId_idx" ON "InspectionTemplate"("facilityId");

-- CreateIndex
CREATE INDEX "InspectionTemplateVersion_templateId_idx" ON "InspectionTemplateVersion"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionTemplateVersion_templateId_version_key" ON "InspectionTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "InspectionTemplateItem_templateVersionId_idx" ON "InspectionTemplateItem"("templateVersionId");

-- CreateIndex
CREATE INDEX "ScheduledInspection_facilityId_idx" ON "ScheduledInspection"("facilityId");

-- CreateIndex
CREATE INDEX "ScheduledInspection_dueDate_idx" ON "ScheduledInspection"("dueDate");

-- CreateIndex
CREATE INDEX "ScheduledInspection_status_idx" ON "ScheduledInspection"("status");

-- CreateIndex
CREATE INDEX "InspectionRun_facilityId_idx" ON "InspectionRun"("facilityId");

-- CreateIndex
CREATE INDEX "InspectionRun_performedByUserId_idx" ON "InspectionRun"("performedByUserId");

-- CreateIndex
CREATE INDEX "InspectionRun_performedAt_idx" ON "InspectionRun"("performedAt");

-- CreateIndex
CREATE INDEX "InspectionItemResult_inspectionRunId_idx" ON "InspectionItemResult"("inspectionRunId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionItemResult_inspectionRunId_templateItemId_key" ON "InspectionItemResult"("inspectionRunId", "templateItemId");

-- CreateIndex
CREATE INDEX "InspectionSignature_inspectionRunId_idx" ON "InspectionSignature"("inspectionRunId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_facilityId_idx" ON "CorrectiveAction"("facilityId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_assetId_idx" ON "CorrectiveAction"("assetId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_status_idx" ON "CorrectiveAction"("status");

-- CreateIndex
CREATE INDEX "CorrectiveAction_dueDate_idx" ON "CorrectiveAction"("dueDate");

-- CreateIndex
CREATE INDEX "CorrectiveAction_ownerUserId_idx" ON "CorrectiveAction"("ownerUserId");

-- CreateIndex
CREATE INDEX "CorrectiveActionComment_actionId_idx" ON "CorrectiveActionComment"("actionId");

-- CreateIndex
CREATE INDEX "CorrectiveActionEvidence_actionId_idx" ON "CorrectiveActionEvidence"("actionId");

-- CreateIndex
CREATE INDEX "CorrectiveActionStatusHistory_actionId_idx" ON "CorrectiveActionStatusHistory"("actionId");

-- CreateIndex
CREATE INDEX "Personnel_facilityId_idx" ON "Personnel"("facilityId");

-- CreateIndex
CREATE INDEX "TrainingEvent_facilityId_idx" ON "TrainingEvent"("facilityId");

-- CreateIndex
CREATE INDEX "TrainingEvent_eventDate_idx" ON "TrainingEvent"("eventDate");

-- CreateIndex
CREATE INDEX "TrainingAttendance_eventId_idx" ON "TrainingAttendance"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAttendance_eventId_personnelId_key" ON "TrainingAttendance"("eventId", "personnelId");

-- CreateIndex
CREATE INDEX "TrainingSignature_eventId_idx" ON "TrainingSignature"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSignature_eventId_userId_key" ON "TrainingSignature"("eventId", "userId");

-- CreateIndex
CREATE INDEX "ObligationRecord_facilityId_idx" ON "ObligationRecord"("facilityId");

-- CreateIndex
CREATE INDEX "ObligationRecord_status_idx" ON "ObligationRecord"("status");

-- CreateIndex
CREATE INDEX "ObligationRecord_dueDate_idx" ON "ObligationRecord"("dueDate");

-- CreateIndex
CREATE INDEX "ObligationRecord_obligationType_idx" ON "ObligationRecord"("obligationType");

-- CreateIndex
CREATE INDEX "ValidationResult_facilityId_idx" ON "ValidationResult"("facilityId");

-- AddForeignKey
ALTER TABLE "RegulatoryRequirement" ADD CONSTRAINT "RegulatoryRequirement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplate" ADD CONSTRAINT "InspectionTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplate" ADD CONSTRAINT "InspectionTemplate_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplateVersion" ADD CONSTRAINT "InspectionTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InspectionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplateItem" ADD CONSTRAINT "InspectionTemplateItem_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "InspectionTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplateItem" ADD CONSTRAINT "InspectionTemplateItem_regulatoryRequirementId_fkey" FOREIGN KEY ("regulatoryRequirementId") REFERENCES "RegulatoryRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledInspection" ADD CONSTRAINT "ScheduledInspection_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledInspection" ADD CONSTRAINT "ScheduledInspection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InspectionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledInspection" ADD CONSTRAINT "ScheduledInspection_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRun" ADD CONSTRAINT "InspectionRun_scheduledInspectionId_fkey" FOREIGN KEY ("scheduledInspectionId") REFERENCES "ScheduledInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRun" ADD CONSTRAINT "InspectionRun_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRun" ADD CONSTRAINT "InspectionRun_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionItemResult" ADD CONSTRAINT "InspectionItemResult_inspectionRunId_fkey" FOREIGN KEY ("inspectionRunId") REFERENCES "InspectionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionItemResult" ADD CONSTRAINT "InspectionItemResult_templateItemId_fkey" FOREIGN KEY ("templateItemId") REFERENCES "InspectionTemplateItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionSignature" ADD CONSTRAINT "InspectionSignature_inspectionRunId_fkey" FOREIGN KEY ("inspectionRunId") REFERENCES "InspectionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_regulatoryRequirementId_fkey" FOREIGN KEY ("regulatoryRequirementId") REFERENCES "RegulatoryRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_sourceInspectionItemId_fkey" FOREIGN KEY ("sourceInspectionItemId") REFERENCES "InspectionTemplateItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_sourceInspectionRunId_fkey" FOREIGN KEY ("sourceInspectionRunId") REFERENCES "InspectionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveActionComment" ADD CONSTRAINT "CorrectiveActionComment_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "CorrectiveAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveActionEvidence" ADD CONSTRAINT "CorrectiveActionEvidence_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "CorrectiveAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveActionStatusHistory" ADD CONSTRAINT "CorrectiveActionStatusHistory_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "CorrectiveAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEvent" ADD CONSTRAINT "TrainingEvent_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TrainingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSignature" ADD CONSTRAINT "TrainingSignature_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TrainingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSignature" ADD CONSTRAINT "TrainingSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligationRecord" ADD CONSTRAINT "ObligationRecord_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationResult" ADD CONSTRAINT "ValidationResult_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
