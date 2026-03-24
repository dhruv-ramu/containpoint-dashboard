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
        html = renderFullAuditPack(facility as AuditPackFacility, timestamp);
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

const EXPORT_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 40px 80px;
    color: #1f2937;
    line-height: 1.6;
    font-size: 14px;
  }
  @media print { body { padding: 24px; } }
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #111827;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 12px;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 1.15rem;
    font-weight: 600;
    color: #374151;
    margin-top: 32px;
    margin-bottom: 12px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e5e7eb;
  }
  .meta {
    color: #6b7280;
    font-size: 0.85rem;
    margin-bottom: 28px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px 24px;
  }
  .meta span { white-space: nowrap; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  th, td {
    border: 1px solid #e5e7eb;
    padding: 10px 14px;
    text-align: left;
  }
  th {
    background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
    font-weight: 600;
    color: #374151;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  tr:nth-child(even) { background: #fafafa; }
  tr:hover { background: #f5f5f5; }
  .empty-state { color: #9ca3af; font-style: italic; padding: 24px; text-align: center; }
  .section-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    margin: 16px 0;
  }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .badge-danger { background: #fee2e2; color: #991b1b; }
  .badge-neutral { background: #e5e7eb; color: #4b5563; }
  .page-break { page-break-before: always; }
  .toc-item { margin: 8px 0; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 0.8rem; color: #9ca3af; }
`;

function docHeader(title: string, facilityName: string, generatedAt: string): string {
  const d = new Date(generatedAt);
  const dateStr = d.toLocaleDateString("en-US", { dateStyle: "long" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} — ${escapeHtml(facilityName)}</title>
  <style>${EXPORT_STYLES}</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    <span><strong>Facility:</strong> ${escapeHtml(facilityName)}</span>
    <span><strong>Generated:</strong> ${dateStr} at ${timeStr}</span>
  </div>
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

// Type for facility in full audit pack (matches Prisma include)
type AuditPackFacility = {
  name: string;
  profile: {
    legalName?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    consultantOfRecord?: string | null;
    nextFiveYearReviewDate?: Date | null;
  } | null;
  accountablePerson: { name: string; email: string; title?: string | null } | null;
  applicability: Array<{ spccApplicable: boolean; assessedAt: Date }>;
  qualification: Array<{ tier: string; qualifiedFacility: boolean }>;
  plan?: { currentVersion: { versionNumber?: number; effectiveDate?: Date } | null } | null;
  assets: Array<{
    assetCode: string;
    name: string;
    assetType: string;
    storageCapacityGallons?: number | null;
    oilType?: { label: string } | null;
    status: string;
    nextInspectionDate?: Date | null;
  }>;
  containmentUnits: Array<{
    code: string;
    name: string;
    containmentType: string;
    calculatedCapacityGallons?: number | null;
  }>;
  correctiveActions: Array<{
    title: string;
    status: string;
    severity: string;
    dueDate: Date | null;
    asset?: { name: string } | null;
  }>;
  trainingEvents: Array<{
    type: string;
    eventDate: Date;
    instructorName?: string | null;
    attendance: unknown[];
  }>;
  incidents: Array<{
    title: string;
    occurredAt: Date;
    estimatedTotalSpilledGallons?: number | null;
    severity: string;
  }>;
  planReviews: Array<{ dueDate: Date; status: string; summary?: string | null }>;
  scheduledInspections?: Array<{
    dueDate: Date;
    status: string;
    template?: { name: string } | null;
    asset?: { name: string } | null;
  }>;
  files?: Array<{ fileName: string; mimeType: string; uploadedAt: Date }>;
};

function renderFullAuditPack(facility: AuditPackFacility, timestamp: string): string {
  let html = docHeader("SPCC Compliance Audit Pack", facility.name, timestamp);

  html += `
  <div class="section-card">
    <p><strong>Document purpose:</strong> This audit pack consolidates compliance evidence for facility ${escapeHtml(facility.name)}. It includes facility profile, applicability, qualification, asset inventory, containment, corrective actions, training records, incident log, plan reviews, and inspection schedule.</p>
  </div>

  <h2>1. Facility Profile</h2>`;
  const profile = facility.profile;
  if (profile) {
    html += `
  <table>
    <tr><th>Legal name</th><td>${escapeHtml(profile.legalName ?? "—")}</td></tr>
    <tr><th>Address</th><td>${escapeHtml([profile.addressLine1, profile.city, profile.state, profile.postalCode].filter(Boolean).join(", ") || "—")}</td></tr>
    <tr><th>Emergency contact</th><td>${escapeHtml(profile.emergencyContactName ?? "—")} ${profile.emergencyContactPhone ? `(${escapeHtml(profile.emergencyContactPhone)})` : ""}</td></tr>
    <tr><th>Consultant of record</th><td>${escapeHtml(profile.consultantOfRecord ?? "—")}</td></tr>
    <tr><th>Next 5-year review</th><td>${profile.nextFiveYearReviewDate ? new Date(profile.nextFiveYearReviewDate).toLocaleDateString() : "—"}</td></tr>
  </table>`;
    if (facility.accountablePerson) {
      html += `<p><strong>Accountable person:</strong> ${escapeHtml(facility.accountablePerson.name)}${facility.accountablePerson.title ? ` (${escapeHtml(facility.accountablePerson.title)})` : ""} — ${escapeHtml(facility.accountablePerson.email)}</p>`;
    }
  } else {
    html += '<p class="empty-state">Profile not completed</p>';
  }

  html += `<h2>2. Applicability &amp; Qualification</h2>`;
  const app = facility.applicability[0];
  const qual = facility.qualification[0];
  html += `
  <table>
    <tr><th>SPCC applicable</th><td>${app ? (app.spccApplicable ? "Yes" : "No") : "—"}</td></tr>
    <tr><th>Qualification tier</th><td>${qual ? String(qual.tier).replace(/_/g, " ") : "—"}</td></tr>
    <tr><th>Qualified facility</th><td>${qual ? (qual.qualifiedFacility ? "Yes" : "No") : "—"}</td></tr>
  </table>`;

  html += `<h2>3. Plan Summary</h2>`;
  const ver = facility.plan?.currentVersion;
  if (ver) {
    html += `<p>Plan version: ${ver.versionNumber ?? "—"}${ver.effectiveDate ? ` | Effective: ${new Date(ver.effectiveDate).toLocaleDateString()}` : ""}</p>`;
  } else {
    html += '<p class="empty-state">No approved plan version</p>';
  }

  html += `<h2>4. Asset Inventory</h2><p>${facility.assets.length} asset(s)</p>`;
  if (facility.assets.length > 0) {
    html += `<table><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Capacity (gal)</th><th>Oil type</th><th>Status</th><th>Next inspection</th></tr></thead><tbody>`;
    for (const a of facility.assets) {
      html += `<tr><td>${escapeHtml(a.assetCode)}</td><td>${escapeHtml(a.name)}</td><td>${a.assetType.replace(/_/g, " ")}</td><td>${a.storageCapacityGallons ?? "—"}</td><td>${escapeHtml(a.oilType?.label ?? "—")}</td><td>${a.status}</td><td>${a.nextInspectionDate ? new Date(a.nextInspectionDate).toLocaleDateString() : "—"}</td></tr>`;
    }
    html += "</tbody></table>";
  }

  html += `<h2>5. Containment Units</h2><p>${facility.containmentUnits.length} unit(s)</p>`;
  if (facility.containmentUnits.length > 0) {
    html += `<table><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Capacity (gal)</th></tr></thead><tbody>`;
    for (const u of facility.containmentUnits) {
      html += `<tr><td>${escapeHtml(u.code)}</td><td>${escapeHtml(u.name)}</td><td>${u.containmentType}</td><td>${u.calculatedCapacityGallons ?? "—"}</td></tr>`;
    }
    html += "</tbody></table>";
  }

  html += `<h2>6. Corrective Actions</h2><p>${facility.correctiveActions.length} record(s)</p>`;
  if (facility.correctiveActions.length > 0) {
    html += `<table><thead><tr><th>Title</th><th>Asset</th><th>Severity</th><th>Status</th><th>Due date</th></tr></thead><tbody>`;
    for (const a of facility.correctiveActions) {
      html += `<tr><td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.asset?.name ?? "—")}</td><td>${a.severity}</td><td>${a.status}</td><td>${a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}</td></tr>`;
    }
    html += "</tbody></table>";
  }

  html += `<h2>7. Training &amp; Briefing Log</h2><p>${facility.trainingEvents.length} event(s)</p>`;
  if (facility.trainingEvents.length > 0) {
    html += `<table><thead><tr><th>Date</th><th>Type</th><th>Instructor</th><th>Attendees</th></tr></thead><tbody>`;
    for (const e of facility.trainingEvents) {
      const count = Array.isArray(e.attendance) ? e.attendance.length : 0;
      html += `<tr><td>${new Date(e.eventDate).toLocaleDateString()}</td><td>${e.type}</td><td>${escapeHtml(e.instructorName ?? "—")}</td><td>${count}</td></tr>`;
    }
    html += "</tbody></table>";
  }

  html += `<h2>8. Incident / Discharge Log</h2><p>${facility.incidents.length} record(s)</p>`;
  if (facility.incidents.length > 0) {
    html += `<table><thead><tr><th>Date</th><th>Title</th><th>Est. spilled (gal)</th><th>Severity</th></tr></thead><tbody>`;
    for (const i of facility.incidents) {
      html += `<tr><td>${new Date(i.occurredAt).toLocaleDateString()}</td><td>${escapeHtml(i.title)}</td><td>${i.estimatedTotalSpilledGallons ?? "—"}</td><td>${i.severity}</td></tr>`;
    }
    html += "</tbody></table>";
  }

  const schedInspects = facility.scheduledInspections ?? [];
  const fileList = facility.files ?? [];

  html += `<h2>9. Plan Reviews</h2><p>${facility.planReviews.length} review(s)</p>`;
  if (facility.planReviews.length > 0) {
    html += `<table><thead><tr><th>Due date</th><th>Status</th><th>Summary</th></tr></thead><tbody>`;
    for (const r of facility.planReviews) {
      html += `<tr><td>${new Date(r.dueDate).toLocaleDateString()}</td><td>${r.status}</td><td>${escapeHtml(r.summary ?? "—")}</td></tr>`;
    }
    html += "</tbody></table>";
  }

  html += `<h2>10. Inspection Schedule (recent)</h2><p>${schedInspects.length} scheduled inspection(s)</p>`;
  if (schedInspects.length > 0) {
    html += `<table><thead><tr><th>Due date</th><th>Template</th><th>Asset</th><th>Status</th></tr></thead><tbody>`;
    for (const s of schedInspects.slice(0, 25)) {
      html += `<tr><td>${new Date(s.dueDate).toLocaleDateString()}</td><td>${escapeHtml(s.template?.name ?? "—")}</td><td>${escapeHtml(s.asset?.name ?? "—")}</td><td>${s.status}</td></tr>`;
    }
    if (schedInspects.length > 25) {
      html += `<tr><td colspan="4" class="empty-state">… and ${schedInspects.length - 25} more</td></tr>`;
    }
    html += "</tbody></table>";
  }

  html += `<h2>11. File Attachments</h2><p>${fileList.length} file(s) on record</p>`;
  if (fileList.length > 0) {
    html += `<table><thead><tr><th>File name</th><th>Type</th><th>Uploaded</th></tr></thead><tbody>`;
    for (const f of fileList) {
      html += `<tr><td>${escapeHtml(f.fileName)}</td><td>${escapeHtml(f.mimeType)}</td><td>${new Date(f.uploadedAt).toLocaleDateString()}</td></tr>`;
    }
    html += "</tbody></table>";
  }

  html += `<div class="footer">
    <p>Generated by ContainPoint. This document is for compliance and audit purposes. Facility: ${escapeHtml(facility.name)}. Export timestamp: ${timestamp}.</p>
  </div></body></html>`;
  return html;
}
