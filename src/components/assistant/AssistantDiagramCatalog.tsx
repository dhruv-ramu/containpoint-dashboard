"use client";

import type { ComplianceDiagramId } from "@/lib/assistant-diagram-spec";
import { isComplianceDiagramId } from "@/lib/assistant-diagram-spec";
import { cn } from "@/lib/utils";

function DiagramFrame({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="my-3 rounded-xl border border-[var(--border)] bg-white overflow-hidden shadow-sm">
      <figcaption className="px-3 py-2 border-b border-[var(--border)] bg-[var(--mist-gray)]/40">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Diagram
        </span>
        <span className="block font-serif text-sm font-semibold text-[var(--foreground)] mt-0.5">
          {title}
        </span>
        {caption ? (
          <p className="text-xs text-[var(--muted)] mt-1 leading-snug">{caption}</p>
        ) : null}
      </figcaption>
      <div className="p-4 bg-gradient-to-b from-white to-[var(--mist-gray)]/20">{children}</div>
    </figure>
  );
}

function ApplicabilityFlow() {
  return (
    <svg viewBox="0 0 440 200" className="w-full max-h-48" aria-hidden>
      <defs>
        <marker
          id="cp-arrow-applicability"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#4a6fa5" />
        </marker>
      </defs>
      <rect x="8" y="72" width="120" height="56" rx="8" fill="#e8eef4" stroke="#4a6fa5" />
      <text x="68" y="98" textAnchor="middle" className="fill-[#1a1a1a] text-[11px] font-sans">
        Oil storage
      </text>
      <text x="68" y="114" textAnchor="middle" className="fill-[#555] text-[9px] font-sans">
        at facility?
      </text>
      <path
        d="M128 100 H160"
        stroke="#4a6fa5"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#cp-arrow-applicability)"
      />
      <rect x="168" y="72" width="124" height="56" rx="8" fill="#e8eef4" stroke="#4a6fa5" />
      <text x="230" y="98" textAnchor="middle" className="fill-[#1a1a1a] text-[11px] font-sans">
        ≥ threshold
      </text>
      <text x="230" y="114" textAnchor="middle" className="fill-[#555] text-[9px] font-sans">
        (40 CFR 112)
      </text>
      <path
        d="M292 100 H324"
        stroke="#4a6fa5"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#cp-arrow-applicability)"
      />
      <rect x="332" y="64" width="100" height="72" rx="8" fill="#dce8f4" stroke="#2d4a6f" />
      <text x="382" y="96" textAnchor="middle" className="fill-[#1a1a1a] text-[11px] font-sans">
        SPCC
      </text>
      <text x="382" y="112" textAnchor="middle" className="fill-[#1a1a1a] text-[11px] font-sans">
        applies
      </text>
      <text x="382" y="128" textAnchor="middle" className="fill-[#555555] text-[9px] font-sans">
        Plan + PE
      </text>
      <text x="68" y="40" textAnchor="middle" className="fill-[#666666] text-[10px] font-sans">
        Typical applicability screening (simplified)
      </text>
    </svg>
  );
}

function SecondaryContainment() {
  return (
    <svg viewBox="0 0 400 180" className="w-full max-h-44" aria-hidden>
      <rect x="40" y="24" width="320" height="120" rx="4" fill="#f0f4f8" stroke="#94a3b8" />
      <text x="200" y="48" textAnchor="middle" className="fill-[#64748b] text-[10px] font-sans">
        Secondary containment (berm / dike)
      </text>
      <rect x="120" y="64" width="160" height="64" rx="6" fill="#dbeafe" stroke="#4a6fa5" />
      <rect x="148" y="80" width="44" height="36" rx="4" fill="#93c5fd" stroke="#2563eb" />
      <rect x="208" y="80" width="44" height="36" rx="4" fill="#93c5fd" stroke="#2563eb" />
      <text x="170" y="102" textAnchor="middle" className="fill-[#1e3a5f] text-[8px] font-sans">
        Tank
      </text>
      <text x="230" y="102" textAnchor="middle" className="fill-[#1e3a5f] text-[8px] font-sans">
        Tank
      </text>
      <text x="200" y="158" textAnchor="middle" className="fill-[#475569] text-[9px] font-sans">
        Volume must contain largest single vessel + practical factors (see 40 CFR 112.8)
      </text>
    </svg>
  );
}

function InspectionCycle() {
  return (
    <svg viewBox="0 0 360 200" className="w-full max-h-48" aria-hidden>
      <circle cx="180" cy="100" r="72" fill="none" stroke="#cbd5e1" strokeWidth="2" />
      <path
        d="M180 28 A72 72 0 1 1 179.9 28"
        fill="none"
        stroke="#4a6fa5"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <text x="180" y="88" textAnchor="middle" className="fill-[#1a1a1a] text-[11px] font-sans font-semibold">
        Inspect
      </text>
      <text x="180" y="108" textAnchor="middle" className="fill-[#555555] text-[9px] font-sans">
        Record → Correct
      </text>
      <text x="180" y="128" textAnchor="middle" className="fill-[#555555] text-[9px] font-sans">
        → Management review
      </text>
      <text x="180" y="188" textAnchor="middle" className="fill-[#64748b] text-[9px] font-sans">
        Ongoing integrity + monthly / periodic checks per plan
      </text>
    </svg>
  );
}

function TierQualification() {
  return (
    <svg viewBox="0 0 420 160" className="w-full max-h-40" aria-hidden>
      <rect x="16" y="48" width="110" height="64" rx="8" fill="#eef2ff" stroke="#6366f1" />
      <text x="71" y="78" textAnchor="middle" className="fill-[#312e81] text-[10px] font-sans font-semibold">
        Tier I / II
      </text>
      <text x="71" y="96" textAnchor="middle" className="fill-[#4338ca] text-[8px] font-sans">
        Self-certified
      </text>
      <text x="71" y="108" textAnchor="middle" className="fill-[#4338ca] text-[8px] font-sans">
        template plan
      </text>
      <text x="210" y="32" textAnchor="middle" className="fill-[#64748b] text-[9px] font-sans">
        Qualification depends on oil types, storage, and complexity
      </text>
      <rect x="155" y="48" width="110" height="64" rx="8" fill="#fef3c7" stroke="#d97706" />
      <text x="210" y="78" textAnchor="middle" className="fill-[#78350f] text-[10px] font-sans font-semibold">
        Qualified Facility
      </text>
      <text x="210" y="96" textAnchor="middle" className="fill-[#92400e] text-[8px] font-sans">
        Streamlined
      </text>
      <text x="210" y="108" textAnchor="middle" className="fill-[#92400e] text-[8px] font-sans">
        requirements
      </text>
      <rect x="294" y="48" width="110" height="64" rx="8" fill="#fce7f3" stroke="#db2777" />
      <text x="349" y="78" textAnchor="middle" className="fill-[#831843] text-[10px] font-sans font-semibold">
        Non-qualified
      </text>
      <text x="349" y="96" textAnchor="middle" className="fill-[#9d174d] text-[8px] font-sans">
        Full PE
      </text>
      <text x="349" y="108" textAnchor="middle" className="fill-[#9d174d] text-[8px] font-sans">
        certified plan
      </text>
    </svg>
  );
}

function PlanReview() {
  return (
    <svg viewBox="0 0 400 140" className="w-full max-h-36" aria-hidden>
      <rect x="20" y="50" width="88" height="44" rx="6" fill="#e8eef4" stroke="#4a6fa5" />
      <text x="64" y="76" textAnchor="middle" className="fill-[#1a1a1a] text-[9px] font-sans">
        Plan
      </text>
      <path d="M108 72 H140" stroke="#4a6fa5" strokeWidth="2" markerEnd="url(#cp-arrow-plan-review)" />
      <rect x="144" y="50" width="96" height="44" rx="6" fill="#f1f5f9" stroke="#64748b" />
      <text x="192" y="76" textAnchor="middle" className="fill-[#1a1a1a] text-[9px] font-sans">
        Amendment
      </text>
      <path d="M240 72 H272" stroke="#4a6fa5" strokeWidth="2" markerEnd="url(#cp-arrow-plan-review)" />
      <rect x="276" y="50" width="100" height="44" rx="6" fill="#dce8f4" stroke="#2d4a6f" />
      <text x="326" y="76" textAnchor="middle" className="fill-[#1a1a1a] text-[9px] font-sans">
        Re-approval
      </text>
      <defs>
        <marker id="cp-arrow-plan-review" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#4a6fa5" />
        </marker>
      </defs>
      <text x="200" y="118" textAnchor="middle" className="fill-[#64748b] text-[9px] font-sans">
        Material change triggers review against 40 CFR 112.5 / 112.6
      </text>
    </svg>
  );
}

const TITLES: Record<ComplianceDiagramId, string> = {
  "spcc-applicability-flow": "SPCC applicability (conceptual)",
  "secondary-containment-layers": "Secondary containment concept",
  "inspection-cycle": "Inspection and corrective-action loop",
  "tier-qualification-i-ii": "Facility qualification tiers (overview)",
  "plan-review-amendment": "Plan change and re-approval flow",
};

export function AssistantDiagram({
  diagramId,
  caption,
  className,
}: {
  diagramId: string;
  caption?: string;
  className?: string;
}) {
  if (!isComplianceDiagramId(diagramId)) {
    return (
      <p className="text-xs text-[var(--muted)] my-2">
        Unknown diagram reference: <code className="font-mono">{diagramId}</code>
      </p>
    );
  }

  const title = TITLES[diagramId];
  const body =
    diagramId === "spcc-applicability-flow" ? (
      <ApplicabilityFlow />
    ) : diagramId === "secondary-containment-layers" ? (
      <SecondaryContainment />
    ) : diagramId === "inspection-cycle" ? (
      <InspectionCycle />
    ) : diagramId === "tier-qualification-i-ii" ? (
      <TierQualification />
    ) : (
      <PlanReview />
    );

  return (
    <div className={cn("assistant-diagram", className)}>
      <DiagramFrame title={title} caption={caption}>
        {body}
      </DiagramFrame>
    </div>
  );
}
