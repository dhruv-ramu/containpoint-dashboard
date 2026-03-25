"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useFacilityScope } from "./facility-context";

const SEGMENT_LABELS: Record<string, string> = {
  applicability: "Applicability",
  assets: "Assets",
  assistant: "Assistant",
  containment: "Containment",
  "corrective-actions": "Corrective actions",
  exports: "Exports",
  incidents: "Incidents",
  inspections: "Inspections",
  obligations: "Obligations",
  plan: "Plan",
  profile: "Profile",
  setup: "Setup",
  training: "Training",
  new: "New",
  edit: "Edit",
  schedule: "Schedule",
  templates: "Templates",
  run: "Run",
};

function segmentLabel(segment: string) {
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ");
}

export function FacilityScopeStrip() {
  const pathname = usePathname();
  const facility = useFacilityScope();
  if (!facility) return null;

  const prefix = `/app/facilities/${facility.id}`;
  const rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";
  const segments = rest.split("/").filter(Boolean);

  const crumbs: { href: string; label: string }[] = [
    { href: "/app", label: "App" },
    { href: "/app/facilities", label: "Facilities" },
    { href: prefix, label: facility.name },
  ];

  let acc = prefix;
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({ href: acc, label: segmentLabel(seg) });
  }

  return (
    <div className="flex flex-col gap-2 min-w-0 w-full sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm min-w-0">
        {crumbs.map((c, i) => (
          <span key={`${c.href}-${i}`} className="flex items-center gap-1 min-w-0">
            {i > 0 ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" aria-hidden />
            ) : null}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-[var(--foreground)] truncate">{c.label}</span>
            ) : (
              <Link
                href={c.href}
                className="text-[var(--steel-blue)] hover:underline truncate max-w-[10rem] sm:max-w-none"
              >
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-3 text-xs text-[var(--muted)] shrink-0">
        <span>
          <span className="hidden sm:inline">Active facility: </span>
          <span className="font-medium text-[var(--foreground)]">{facility.name}</span>
        </span>
        <Link href="/app/facilities" className="text-[var(--steel-blue)] hover:underline whitespace-nowrap">
          Switch facility
        </Link>
      </div>
    </div>
  );
}
