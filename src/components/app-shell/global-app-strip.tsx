"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const FACILITY_DETAIL = /^\/app\/facilities\/[^/]+(\/.*)?$/;

export function GlobalAppStrip() {
  const pathname = usePathname();
  if (!pathname?.startsWith("/app")) return null;
  if (FACILITY_DETAIL.test(pathname)) return null;

  const crumbs: { href: string; label: string }[] = [{ href: "/app", label: "App" }];

  if (pathname === "/app" || pathname === "/app/") {
    // only App
  } else if (pathname.startsWith("/app/facilities")) {
    crumbs.push({ href: "/app/facilities", label: "Facilities" });
    if (pathname.includes("/new")) {
      crumbs.push({ href: pathname, label: "New facility" });
    }
  } else if (pathname.startsWith("/app/portfolio")) {
    crumbs.push({ href: "/app/portfolio", label: "Portfolio" });
  } else if (pathname.startsWith("/app/settings")) {
    crumbs.push({ href: "/app/settings", label: "Settings" });
  } else {
    crumbs.push({ href: pathname, label: "Page" });
  }

  return (
    <div className="mb-4 pb-3 border-b border-[var(--border)]">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-[var(--muted)]">
        {crumbs.map((c, i) => (
          <span key={`${c.href}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-[var(--foreground)]">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-[var(--steel-blue)] hover:underline">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
