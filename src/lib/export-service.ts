import { prisma } from "@/lib/db";
import { saveFile } from "@/lib/storage";
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
        plan: { include: { currentVersion: true } },
        assets: { include: { oilType: true } },
        containmentUnits: true,
        incidents: true,
        correctiveActions: { include: { asset: true } },
        trainingEvents: { include: { attendance: { include: { personnel: true } } } },
        planReviews: { orderBy: { dueDate: "desc" }, take: 5 },
      },
    });

    if (!facility) {
      throw new Error("Facility not found");
    }

    const timestamp = new Date().toISOString();
    const facilityName = facility.name;

    let html = "";
    let fileName = "";

    switch (exportType) {
      case "PLAN_PDF":
        html = renderPlanSummary(facility, timestamp);
        fileName = `SPCC_Plan_Summary_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.html`;
        break;
      case "INSPECTION_REPORT":
        html = renderInspectionReport(facility, timestamp);
        fileName = `Inspection_Report_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.html`;
        break;
      case "CORRECTIVE_ACTION_REGISTER":
        html = renderCorrectiveActionRegister(facility, timestamp);
        fileName = `Corrective_Action_Register_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.html`;
        break;
      case "TRAINING_LOG":
        html = renderTrainingLog(facility, timestamp);
        fileName = `Training_Log_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.html`;
        break;
      case "CONTAINER_INVENTORY":
        html = renderContainerInventory(facility, timestamp);
        fileName = `Container_Inventory_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.html`;
        break;
      case "CONTAINMENT_BASIS":
        html = renderContainmentBasis(facility, timestamp);
        fileName = `Containment_Basis_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.html`;
        break;
      case "REVIEW_MEMO":
        html = renderReviewMemo(facility, timestamp);
        fileName = `Review_Memo_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.html`;
        break;
      case "INCIDENT_LOG":
        html = renderIncidentLog(facility, timestamp);
        fileName = `Incident_Log_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.html`;
        break;
      case "FULL_AUDIT_PACK":
        html = renderFullAuditPack(facility, timestamp);
        fileName = `Audit_Pack_${sanitizeFileName(facilityName)}_${timestamp.slice(0, 10)}.html`;
        break;
      default:
        throw new Error(`Unknown export type: ${exportType}`);
    }

    const buffer = Buffer.from(html, "utf-8");
    const storageKey = await saveFile(buffer, "html");

    await prisma.exportArtifact.create({
      data: {
        exportJobId: job.id,
        fileName,
        storageKey,
        mimeType: "text/html",
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

function docHeader(title: string, facilityName: string, generatedAt: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
  h2 { font-size: 1.2em; margin-top: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  .meta { color: #666; font-size: 0.9em; margin-bottom: 24px; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Facility: ${escapeHtml(facilityName)} | Generated: ${escapeHtml(generatedAt)}</p>
`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPlanSummary(facility: { name: string; plan?: { currentVersion: unknown } | null }, timestamp: string): string {
  const v = facility.plan?.currentVersion as { versionNumber?: number; effectiveDate?: Date } | undefined;
  let html = docHeader("SPCC Plan Summary", facility.name, timestamp);
  html += `<p>Plan version: ${v?.versionNumber ?? "—"}</p>`;
  html += v?.effectiveDate
    ? `<p>Effective date: ${new Date(v.effectiveDate).toLocaleDateString()}</p>`
    : "<p>No approved plan version.</p>";
  html += "</body></html>";
  return html;
}

function renderInspectionReport(facility: { name: string }, _timestamp: string): string {
  let html = docHeader("Inspection Report", facility.name, new Date().toISOString());
  html += "<p>Inspection history and schedules. (Expand with inspection run data.)</p>";
  html += "</body></html>";
  return html;
}

function renderCorrectiveActionRegister(
  facility: { name: string; correctiveActions: Array<{ title: string; status: string; severity: string; dueDate: Date | null; asset?: { name: string } | null }> },
  timestamp: string
): string {
  let html = docHeader("Corrective Action Register", facility.name, timestamp);
  html += "<table><thead><tr><th>Title</th><th>Asset</th><th>Severity</th><th>Status</th><th>Due</th></tr></thead><tbody>";
  for (const a of facility.correctiveActions) {
    html += `<tr><td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.asset?.name ?? "—")}</td><td>${a.severity}</td><td>${a.status}</td><td>${a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}</td></tr>`;
  }
  html += "</tbody></table></body></html>";
  return html;
}

function renderTrainingLog(
  facility: { name: string; trainingEvents: Array<{ type: string; eventDate: Date; instructorName?: string | null; attendance: unknown[] }> },
  timestamp: string
): string {
  let html = docHeader("Training & Briefing Log", facility.name, timestamp);
  html += "<table><thead><tr><th>Date</th><th>Type</th><th>Instructor</th><th>Attendees</th></tr></thead><tbody>";
  for (const e of facility.trainingEvents) {
    const count = Array.isArray(e.attendance) ? e.attendance.length : 0;
    html += `<tr><td>${new Date(e.eventDate).toLocaleDateString()}</td><td>${e.type}</td><td>${escapeHtml(e.instructorName ?? "—")}</td><td>${count}</td></tr>`;
  }
  html += "</tbody></table></body></html>";
  return html;
}

function renderContainerInventory(
  facility: { name: string; assets: Array<{ assetCode: string; name: string; storageCapacityGallons?: number | null; oilType?: { label: string } | null }> },
  timestamp: string
): string {
  let html = docHeader("Container / Asset Inventory", facility.name, timestamp);
  html += "<table><thead><tr><th>Code</th><th>Name</th><th>Capacity (gal)</th><th>Oil type</th></tr></thead><tbody>";
  for (const a of facility.assets) {
    html += `<tr><td>${escapeHtml(a.assetCode)}</td><td>${escapeHtml(a.name)}</td><td>${a.storageCapacityGallons ?? "—"}</td><td>${escapeHtml(a.oilType?.label ?? "—")}</td></tr>`;
  }
  html += "</tbody></table></body></html>";
  return html;
}

function renderContainmentBasis(
  facility: { name: string; containmentUnits: Array<{ code: string; name: string; containmentType: string; calculatedCapacityGallons?: number | null }> },
  timestamp: string
): string {
  let html = docHeader("Containment Basis", facility.name, timestamp);
  html += "<table><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Capacity (gal)</th></tr></thead><tbody>";
  for (const u of facility.containmentUnits) {
    html += `<tr><td>${escapeHtml(u.code)}</td><td>${escapeHtml(u.name)}</td><td>${u.containmentType}</td><td>${u.calculatedCapacityGallons ?? "—"}</td></tr>`;
  }
  html += "</tbody></table></body></html>";
  return html;
}

function renderReviewMemo(
  facility: { name: string; planReviews: Array<{ dueDate: Date; status: string; summary?: string | null }> },
  timestamp: string
): string {
  let html = docHeader("5-Year Review Memo", facility.name, timestamp);
  html += "<table><thead><tr><th>Due date</th><th>Status</th><th>Summary</th></tr></thead><tbody>";
  for (const r of facility.planReviews) {
    html += `<tr><td>${new Date(r.dueDate).toLocaleDateString()}</td><td>${r.status}</td><td>${escapeHtml(r.summary ?? "—")}</td></tr>`;
  }
  html += "</tbody></table></body></html>";
  return html;
}

function renderIncidentLog(
  facility: { name: string; incidents: Array<{ title: string; occurredAt: Date; estimatedTotalSpilledGallons?: number | null; severity: string }> },
  timestamp: string
): string {
  let html = docHeader("Incident / Discharge Log", facility.name, timestamp);
  html += "<table><thead><tr><th>Date</th><th>Title</th><th>Est. spilled (gal)</th><th>Severity</th></tr></thead><tbody>";
  for (const i of facility.incidents) {
    html += `<tr><td>${new Date(i.occurredAt).toLocaleDateString()}</td><td>${escapeHtml(i.title)}</td><td>${i.estimatedTotalSpilledGallons ?? "—"}</td><td>${i.severity}</td></tr>`;
  }
  html += "</tbody></table></body></html>";
  return html;
}

function renderFullAuditPack(
  facility: {
    name: string;
    profile: unknown;
    plan?: { currentVersion: unknown } | null;
    assets: unknown[];
    containmentUnits: unknown[];
    correctiveActions: unknown[];
    trainingEvents: unknown[];
    incidents: unknown[];
    planReviews: unknown[];
  },
  timestamp: string
): string {
  let html = docHeader("SPCC Compliance Audit Pack", facility.name, timestamp);
  html += "<p>Comprehensive compliance evidence bundle.</p>";
  html += "<h2>1. Facility Profile</h2><p>Profile data on file.</p>";
  html += "<h2>2. Plan Summary</h2><p>Current plan version summary.</p>";
  html += `<h2>3. Asset Inventory</h2><p>${(facility.assets as unknown[]).length} assets.</p>`;
  html += `<h2>4. Containment</h2><p>${(facility.containmentUnits as unknown[]).length} containment units.</p>`;
  html += `<h2>5. Corrective Actions</h2><p>${(facility.correctiveActions as unknown[]).length} corrective actions.</p>`;
  html += `<h2>6. Training</h2><p>${(facility.trainingEvents as unknown[]).length} training events.</p>`;
  html += `<h2>7. Incidents</h2><p>${(facility.incidents as unknown[]).length} incidents.</p>`;
  html += `<h2>8. Reviews</h2><p>${(facility.planReviews as unknown[]).length} plan reviews.</p>`;
  html += "</body></html>";
  return html;
}
