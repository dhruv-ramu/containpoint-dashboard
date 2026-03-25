/** IDs for renderComplianceDiagram tool — keep in sync with AssistantDiagramCatalog. */
export const COMPLIANCE_DIAGRAM_IDS = [
  "spcc-applicability-flow",
  "secondary-containment-layers",
  "inspection-cycle",
  "tier-qualification-i-ii",
  "plan-review-amendment",
] as const;

export type ComplianceDiagramId = (typeof COMPLIANCE_DIAGRAM_IDS)[number];

export function isComplianceDiagramId(id: string): id is ComplianceDiagramId {
  return (COMPLIANCE_DIAGRAM_IDS as readonly string[]).includes(id);
}
