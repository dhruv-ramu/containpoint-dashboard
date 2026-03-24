import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { saveFile } from "@/lib/storage";
import { ExportPdfDocument } from "@/components/pdf/ExportDocument";
import type { ExportType } from "@/generated/prisma/enums";

export async function runExport(
  facilityId: string,
  exportType: ExportType,
  requestedByUserId: string
) {
  const job = await prisma.exportJob.create({
    data: {
      facilityId,
      exportType,
      status: "QUEUED",
      requestedByUserId,
    },
  });

  try {
    await prisma.exportJob.update({
      where: { id: job.id },
      data: { status: "PROCESSING" },
    });

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        profile: true,
        accountablePerson: true,
        applicability: { orderBy: { assessedAt: "desc" }, take: 1 },
        qualification: { orderBy: { assessedAt: "desc" }, take: 1 },
        plan: { include: { currentVersion: true } },
        assets: { include: { oilType: true, containmentLinks: { include: { containmentUnit: true } } } },
        containmentUnits: true,
        incidents: true,
        correctiveActions: { include: { asset: true } },
        trainingEvents: { include: { attendance: { include: { personnel: true } } } },
        planReviews: { orderBy: { dueDate: "desc" }, take: 10 },
        scheduledInspections: {
          include: { template: true, asset: true, runs: { orderBy: { performedAt: "desc" }, take: 5 } },
          orderBy: { dueDate: "desc" },
          take: 50,
        },
        files: { orderBy: { uploadedAt: "desc" }, take: 20 },
      },
    });

    if (!facility) {
      throw new Error("Facility not found");
    }

    const timestamp = new Date().toISOString();
    const facilityName = facility.name;

    const fileNameByType: Record<ExportType, string> = {
      PLAN_PDF: `SPCC_Plan_Summary_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.pdf`,
      INSPECTION_REPORT: `Inspection_Report_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.pdf`,
      CORRECTIVE_ACTION_REGISTER: `Corrective_Action_Register_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.pdf`,
      TRAINING_LOG: `Training_Log_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.pdf`,
      CONTAINER_INVENTORY: `Container_Inventory_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.pdf`,
      CONTAINMENT_BASIS: `Containment_Basis_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.pdf`,
      REVIEW_MEMO: `Review_Memo_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.pdf`,
      INCIDENT_LOG: `Incident_Log_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.pdf`,
      FULL_AUDIT_PACK: `Audit_Pack_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.pdf`,
    };
    const fileName = fileNameByType[exportType] ?? `Export_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.pdf`;

    const doc = React.createElement(ExportPdfDocument, {
      facility: facility as Parameters<typeof ExportPdfDocument>[0]["facility"],
      exportType,
      timestamp,
    });
    const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
    const storageKey = await saveFile(buffer, "pdf");

    await prisma.exportArtifact.create({
      data: {
        exportJobId: job.id,
        fileName,
        storageKey,
        mimeType: "application/pdf",
        createdByUserId: requestedByUserId,
      },
    });

    await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return job.id;
  } catch (err) {
    await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      },
    });
    throw err;
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50);
}
