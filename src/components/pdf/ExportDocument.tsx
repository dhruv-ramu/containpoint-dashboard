import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ExportType } from "@/generated/prisma/enums";

// Minimal type for facility data from Prisma (matches export-service query)
export type ExportFacility = {
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
    status?: string;
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

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#171717",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 8,
  },
  meta: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 24,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  table: { width: "100%", marginTop: 8 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#374151",
    textTransform: "uppercase",
  },
  col: { flex: 1 },
  colNarrow: { width: "12%" },
  colWide: { width: "22%" },
  empty: { color: "#9ca3af", fontStyle: "italic", padding: 16, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
  },
});

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US");
}

function DocHeader({
  title,
  facilityName,
  generatedAt,
}: {
  title: string;
  facilityName: string;
  generatedAt: string;
}) {
  const d = new Date(generatedAt);
  const dateStr = d.toLocaleDateString("en-US", { dateStyle: "long" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>
        Facility: {facilityName} · Generated: {dateStr} at {timeStr}
      </Text>
    </View>
  );
}

function PlanSummary({ facility, timestamp }: { facility: ExportFacility; timestamp: string }) {
  const v = facility.plan?.currentVersion;
  return (
    <Page size="A4" style={styles.page}>
      <DocHeader title="SPCC Plan Summary" facilityName={facility.name} generatedAt={timestamp} />
      <View style={styles.section}>
        <Text>Plan version: {v?.versionNumber ?? "—"}</Text>
        <Text>{v?.effectiveDate ? `Effective date: ${fmtDate(v.effectiveDate)}` : "No approved plan version."}</Text>
      </View>
      <Text style={styles.footer}>ContainPoint · {facility.name} · {timestamp}</Text>
    </Page>
  );
}

function InspectionReport({ facility, timestamp }: { facility: ExportFacility; timestamp: string }) {
  return (
    <Page size="A4" style={styles.page}>
      <DocHeader title="Inspection Report" facilityName={facility.name} generatedAt={timestamp} />
      <View style={styles.section}>
        <Text>Inspection history and schedules.</Text>
      </View>
      <Text style={styles.footer}>ContainPoint · {facility.name} · {timestamp}</Text>
    </Page>
  );
}

function CorrectiveActionRegister({ facility, timestamp }: { facility: ExportFacility; timestamp: string }) {
  const rows = facility.correctiveActions;
  return (
    <Page size="A4" style={styles.page}>
      <DocHeader title="Corrective Action Register" facilityName={facility.name} generatedAt={timestamp} />
      <View style={[styles.table, styles.tableHeader]}>
        <Text style={[styles.colWide, { width: "28%" }]}>Title</Text>
        <Text style={styles.col}>Asset</Text>
        <Text style={styles.colNarrow}>Severity</Text>
        <Text style={styles.colNarrow}>Status</Text>
        <Text style={styles.colNarrow}>Due</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>No corrective actions</Text>
      ) : (
        rows.map((a, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.colWide, { width: "28%" }]}>{a.title}</Text>
            <Text style={styles.col}>{a.asset?.name ?? "—"}</Text>
            <Text style={styles.colNarrow}>{a.severity}</Text>
            <Text style={styles.colNarrow}>{a.status}</Text>
            <Text style={styles.colNarrow}>{fmtDate(a.dueDate)}</Text>
          </View>
        ))
      )}
      <Text style={styles.footer}>ContainPoint · {facility.name} · {timestamp}</Text>
    </Page>
  );
}

function TrainingLog({ facility, timestamp }: { facility: ExportFacility; timestamp: string }) {
  const rows = facility.trainingEvents;
  return (
    <Page size="A4" style={styles.page}>
      <DocHeader title="Training & Briefing Log" facilityName={facility.name} generatedAt={timestamp} />
      <View style={[styles.table, styles.tableHeader]}>
        <Text style={styles.col}>Date</Text>
        <Text style={styles.col}>Type</Text>
        <Text style={styles.col}>Instructor</Text>
        <Text style={styles.colNarrow}>Attendees</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>No training events</Text>
      ) : (
        rows.map((e, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col}>{fmtDate(e.eventDate)}</Text>
            <Text style={styles.col}>{e.type}</Text>
            <Text style={styles.col}>{e.instructorName ?? "—"}</Text>
            <Text style={styles.colNarrow}>{Array.isArray(e.attendance) ? e.attendance.length : 0}</Text>
          </View>
        ))
      )}
      <Text style={styles.footer}>ContainPoint · {facility.name} · {timestamp}</Text>
    </Page>
  );
}

function ContainerInventory({ facility, timestamp }: { facility: ExportFacility; timestamp: string }) {
  const rows = facility.assets;
  return (
    <Page size="A4" style={styles.page}>
      <DocHeader title="Container / Asset Inventory" facilityName={facility.name} generatedAt={timestamp} />
      <View style={[styles.table, styles.tableHeader]}>
        <Text style={styles.colNarrow}>Code</Text>
        <Text style={styles.colWide}>Name</Text>
        <Text style={styles.colNarrow}>Capacity (gal)</Text>
        <Text style={styles.col}>Oil type</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>No assets</Text>
      ) : (
        rows.map((a, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colNarrow}>{a.assetCode}</Text>
            <Text style={styles.colWide}>{a.name}</Text>
            <Text style={styles.colNarrow}>{a.storageCapacityGallons ?? "—"}</Text>
            <Text style={styles.col}>{a.oilType?.label ?? "—"}</Text>
          </View>
        ))
      )}
      <Text style={styles.footer}>ContainPoint · {facility.name} · {timestamp}</Text>
    </Page>
  );
}

function ContainmentBasis({ facility, timestamp }: { facility: ExportFacility; timestamp: string }) {
  const rows = facility.containmentUnits;
  return (
    <Page size="A4" style={styles.page}>
      <DocHeader title="Containment Basis" facilityName={facility.name} generatedAt={timestamp} />
      <View style={[styles.table, styles.tableHeader]}>
        <Text style={styles.colNarrow}>Code</Text>
        <Text style={styles.colWide}>Name</Text>
        <Text style={styles.col}>Type</Text>
        <Text style={styles.colNarrow}>Capacity (gal)</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>No containment units</Text>
      ) : (
        rows.map((u, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colNarrow}>{u.code}</Text>
            <Text style={styles.colWide}>{u.name}</Text>
            <Text style={styles.col}>{u.containmentType}</Text>
            <Text style={styles.colNarrow}>{u.calculatedCapacityGallons ?? "—"}</Text>
          </View>
        ))
      )}
      <Text style={styles.footer}>ContainPoint · {facility.name} · {timestamp}</Text>
    </Page>
  );
}

function ReviewMemo({ facility, timestamp }: { facility: ExportFacility; timestamp: string }) {
  const rows = facility.planReviews;
  return (
    <Page size="A4" style={styles.page}>
      <DocHeader title="5-Year Review Memo" facilityName={facility.name} generatedAt={timestamp} />
      <View style={[styles.table, styles.tableHeader]}>
        <Text style={styles.col}>Due date</Text>
        <Text style={styles.colNarrow}>Status</Text>
        <Text style={styles.colWide}>Summary</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>No plan reviews</Text>
      ) : (
        rows.map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col}>{fmtDate(r.dueDate)}</Text>
            <Text style={styles.colNarrow}>{r.status}</Text>
            <Text style={styles.colWide}>{r.summary ?? "—"}</Text>
          </View>
        ))
      )}
      <Text style={styles.footer}>ContainPoint · {facility.name} · {timestamp}</Text>
    </Page>
  );
}

function IncidentLog({ facility, timestamp }: { facility: ExportFacility; timestamp: string }) {
  const rows = facility.incidents;
  return (
    <Page size="A4" style={styles.page}>
      <DocHeader title="Incident / Discharge Log" facilityName={facility.name} generatedAt={timestamp} />
      <View style={[styles.table, styles.tableHeader]}>
        <Text style={styles.col}>Date</Text>
        <Text style={styles.colWide}>Title</Text>
        <Text style={styles.colNarrow}>Est. spilled (gal)</Text>
        <Text style={styles.colNarrow}>Severity</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>No incidents</Text>
      ) : (
        rows.map((i, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.col}>{fmtDate(i.occurredAt)}</Text>
            <Text style={styles.colWide}>{i.title}</Text>
            <Text style={styles.colNarrow}>{i.estimatedTotalSpilledGallons ?? "—"}</Text>
            <Text style={styles.colNarrow}>{i.severity}</Text>
          </View>
        ))
      )}
      <Text style={styles.footer}>ContainPoint · {facility.name} · {timestamp}</Text>
    </Page>
  );
}

function FullAuditPack({ facility, timestamp }: { facility: ExportFacility; timestamp: string }) {
  const profile = facility.profile;
  const app = facility.applicability[0];
  const qual = facility.qualification[0];
  const ver = facility.plan?.currentVersion;
  const sched = facility.scheduledInspections ?? [];
  const fileList = facility.files ?? [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocHeader title="SPCC Compliance Audit Pack" facilityName={facility.name} generatedAt={timestamp} />
        <View style={styles.section}>
          <Text style={{ marginBottom: 12 }}>
            This audit pack consolidates compliance evidence for facility {facility.name}. It includes facility profile,
            applicability, qualification, asset inventory, containment, corrective actions, training records, incident
            log, plan reviews, and inspection schedule.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1. Facility Profile</Text>
        {profile ? (
          <View style={styles.section}>
            <Text>Legal name: {profile.legalName ?? "—"}</Text>
            <Text>Address: {[profile.addressLine1, profile.city, profile.state, profile.postalCode].filter(Boolean).join(", ") || "—"}</Text>
            <Text>Emergency contact: {profile.emergencyContactName ?? "—"} {profile.emergencyContactPhone ? `(${profile.emergencyContactPhone})` : ""}</Text>
            <Text>Consultant of record: {profile.consultantOfRecord ?? "—"}</Text>
            <Text>Next 5-year review: {fmtDate(profile.nextFiveYearReviewDate)}</Text>
            {facility.accountablePerson && (
              <Text>
                Accountable person: {facility.accountablePerson.name}
                {facility.accountablePerson.title ? ` (${facility.accountablePerson.title})` : ""} — {facility.accountablePerson.email}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.empty}>Profile not completed</Text>
        )}

        <Text style={styles.sectionTitle}>2. Applicability & Qualification</Text>
        <View style={styles.section}>
          <Text>SPCC applicable: {app ? (app.spccApplicable ? "Yes" : "No") : "—"}</Text>
          <Text>Qualification tier: {qual ? String(qual.tier).replace(/_/g, " ") : "—"}</Text>
          <Text>Qualified facility: {qual ? (qual.qualifiedFacility ? "Yes" : "No") : "—"}</Text>
        </View>

        <Text style={styles.sectionTitle}>3. Plan Summary</Text>
        <View style={styles.section}>
          {ver ? (
            <Text>Plan version: {ver.versionNumber ?? "—"} {ver.effectiveDate ? `| Effective: ${fmtDate(ver.effectiveDate)}` : ""}</Text>
          ) : (
            <Text style={styles.empty}>No approved plan version</Text>
          )}
        </View>

        <Text style={styles.footer}>ContainPoint Audit Pack · {facility.name} · {timestamp}</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>4. Asset Inventory</Text>
        <Text style={styles.meta}>{facility.assets.length} asset(s)</Text>
        <View style={[styles.table, styles.tableHeader]}>
          <Text style={styles.colNarrow}>Code</Text>
          <Text style={styles.colWide}>Name</Text>
          <Text style={styles.colNarrow}>Type</Text>
          <Text style={styles.colNarrow}>Capacity</Text>
          <Text style={styles.col}>Oil type</Text>
          <Text style={styles.colNarrow}>Status</Text>
          <Text style={styles.colNarrow}>Next insp.</Text>
        </View>
        {facility.assets.length === 0 ? (
          <Text style={styles.empty}>No assets</Text>
        ) : (
          facility.assets.map((a, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colNarrow}>{a.assetCode}</Text>
              <Text style={styles.colWide}>{a.name}</Text>
              <Text style={styles.colNarrow}>{a.assetType.replace(/_/g, " ")}</Text>
              <Text style={styles.colNarrow}>{a.storageCapacityGallons ?? "—"}</Text>
              <Text style={styles.col}>{a.oilType?.label ?? "—"}</Text>
              <Text style={styles.colNarrow}>{a.status ?? "—"}</Text>
              <Text style={styles.colNarrow}>{fmtDate(a.nextInspectionDate)}</Text>
            </View>
          ))
        )}
        <Text style={styles.footer}>ContainPoint Audit Pack · {facility.name} · {timestamp}</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>5. Containment Units</Text>
        <Text style={styles.meta}>{facility.containmentUnits.length} unit(s)</Text>
        <View style={[styles.table, styles.tableHeader]}>
          <Text style={styles.colNarrow}>Code</Text>
          <Text style={styles.colWide}>Name</Text>
          <Text style={styles.col}>Type</Text>
          <Text style={styles.colNarrow}>Capacity (gal)</Text>
        </View>
        {facility.containmentUnits.length === 0 ? (
          <Text style={styles.empty}>No containment units</Text>
        ) : (
          facility.containmentUnits.map((u, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colNarrow}>{u.code}</Text>
              <Text style={styles.colWide}>{u.name}</Text>
              <Text style={styles.col}>{u.containmentType}</Text>
              <Text style={styles.colNarrow}>{u.calculatedCapacityGallons ?? "—"}</Text>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>6. Corrective Actions</Text>
        <Text style={styles.meta}>{facility.correctiveActions.length} record(s)</Text>
        <View style={[styles.table, styles.tableHeader]}>
          <Text style={styles.colWide}>Title</Text>
          <Text style={styles.col}>Asset</Text>
          <Text style={styles.colNarrow}>Severity</Text>
          <Text style={styles.colNarrow}>Status</Text>
          <Text style={styles.colNarrow}>Due</Text>
        </View>
        {facility.correctiveActions.length === 0 ? (
          <Text style={styles.empty}>No corrective actions</Text>
        ) : (
          facility.correctiveActions.map((a, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colWide}>{a.title}</Text>
              <Text style={styles.col}>{a.asset?.name ?? "—"}</Text>
              <Text style={styles.colNarrow}>{a.severity}</Text>
              <Text style={styles.colNarrow}>{a.status}</Text>
              <Text style={styles.colNarrow}>{fmtDate(a.dueDate)}</Text>
            </View>
          ))
        )}
        <Text style={styles.footer}>ContainPoint Audit Pack · {facility.name} · {timestamp}</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>7. Training & Briefing Log</Text>
        <Text style={styles.meta}>{facility.trainingEvents.length} event(s)</Text>
        <View style={[styles.table, styles.tableHeader]}>
          <Text style={styles.col}>Date</Text>
          <Text style={styles.col}>Type</Text>
          <Text style={styles.col}>Instructor</Text>
          <Text style={styles.colNarrow}>Attendees</Text>
        </View>
        {facility.trainingEvents.length === 0 ? (
          <Text style={styles.empty}>No training events</Text>
        ) : (
          facility.trainingEvents.map((e, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col}>{fmtDate(e.eventDate)}</Text>
              <Text style={styles.col}>{e.type}</Text>
              <Text style={styles.col}>{e.instructorName ?? "—"}</Text>
              <Text style={styles.colNarrow}>{Array.isArray(e.attendance) ? e.attendance.length : 0}</Text>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>8. Incident / Discharge Log</Text>
        <Text style={styles.meta}>{facility.incidents.length} record(s)</Text>
        <View style={[styles.table, styles.tableHeader]}>
          <Text style={styles.col}>Date</Text>
          <Text style={styles.colWide}>Title</Text>
          <Text style={styles.colNarrow}>Spilled (gal)</Text>
          <Text style={styles.colNarrow}>Severity</Text>
        </View>
        {facility.incidents.length === 0 ? (
          <Text style={styles.empty}>No incidents</Text>
        ) : (
          facility.incidents.map((i, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.col}>{fmtDate(i.occurredAt)}</Text>
              <Text style={styles.colWide}>{i.title}</Text>
              <Text style={styles.colNarrow}>{i.estimatedTotalSpilledGallons ?? "—"}</Text>
              <Text style={styles.colNarrow}>{i.severity}</Text>
            </View>
          ))
        )}
        <Text style={styles.footer}>ContainPoint Audit Pack · {facility.name} · {timestamp}</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>9. Plan Reviews</Text>
        <Text style={styles.meta}>{facility.planReviews.length} review(s)</Text>
        <View style={[styles.table, styles.tableHeader]}>
          <Text style={styles.col}>Due date</Text>
          <Text style={styles.colNarrow}>Status</Text>
          <Text style={styles.colWide}>Summary</Text>
        </View>
        {facility.planReviews.length === 0 ? (
          <Text style={styles.empty}>No plan reviews</Text>
        ) : (
          facility.planReviews.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col}>{fmtDate(r.dueDate)}</Text>
              <Text style={styles.colNarrow}>{r.status}</Text>
              <Text style={styles.colWide}>{r.summary ?? "—"}</Text>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>10. Inspection Schedule</Text>
        <Text style={styles.meta}>{sched.length} scheduled inspection(s)</Text>
        <View style={[styles.table, styles.tableHeader]}>
          <Text style={styles.col}>Due date</Text>
          <Text style={styles.col}>Template</Text>
          <Text style={styles.col}>Asset</Text>
          <Text style={styles.colNarrow}>Status</Text>
        </View>
        {sched.length === 0 ? (
          <Text style={styles.empty}>No scheduled inspections</Text>
        ) : (
          sched.slice(0, 25).map((s, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col}>{fmtDate(s.dueDate)}</Text>
              <Text style={styles.col}>{s.template?.name ?? "—"}</Text>
              <Text style={styles.col}>{s.asset?.name ?? "—"}</Text>
              <Text style={styles.colNarrow}>{s.status}</Text>
            </View>
          ))
        )}
        {sched.length > 25 && (
          <Text style={styles.empty}>… and {sched.length - 25} more</Text>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>11. File Attachments</Text>
        <Text style={styles.meta}>{fileList.length} file(s) on record</Text>
        <View style={[styles.table, styles.tableHeader]}>
          <Text style={styles.colWide}>File name</Text>
          <Text style={styles.col}>Type</Text>
          <Text style={styles.col}>Uploaded</Text>
        </View>
        {fileList.length === 0 ? (
          <Text style={styles.empty}>No files</Text>
        ) : (
          fileList.map((f, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colWide}>{f.fileName}</Text>
              <Text style={styles.col}>{f.mimeType}</Text>
              <Text style={styles.col}>{fmtDate(f.uploadedAt)}</Text>
            </View>
          ))
        )}

        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
          <Text style={{ fontSize: 8, color: "#9ca3af" }}>
            Generated by ContainPoint. This document is for compliance and audit purposes. Facility: {facility.name}. Export timestamp: {timestamp}.
          </Text>
        </View>
        <Text style={styles.footer}>ContainPoint Audit Pack · {facility.name} · {timestamp}</Text>
      </Page>
    </Document>
  );
}

export function ExportPdfDocument({
  facility,
  exportType,
  timestamp,
}: {
  facility: ExportFacility;
  exportType: ExportType;
  timestamp: string;
}) {
  const common = { facility, timestamp };
  switch (exportType) {
    case "PLAN_PDF":
      return <Document><PlanSummary {...common} /></Document>;
    case "INSPECTION_REPORT":
      return <Document><InspectionReport {...common} /></Document>;
    case "CORRECTIVE_ACTION_REGISTER":
      return <Document><CorrectiveActionRegister {...common} /></Document>;
    case "TRAINING_LOG":
      return <Document><TrainingLog {...common} /></Document>;
    case "CONTAINER_INVENTORY":
      return <Document><ContainerInventory {...common} /></Document>;
    case "CONTAINMENT_BASIS":
      return <Document><ContainmentBasis {...common} /></Document>;
    case "REVIEW_MEMO":
      return <Document><ReviewMemo {...common} /></Document>;
    case "INCIDENT_LOG":
      return <Document><IncidentLog {...common} /></Document>;
    case "FULL_AUDIT_PACK":
      return <FullAuditPack {...common} />;
    default:
      return <Document><PlanSummary {...common} /></Document>;
  }
}
