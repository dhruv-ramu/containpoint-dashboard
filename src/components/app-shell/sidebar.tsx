"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Settings,
  ChevronLeft,
  ClipboardList,
  Box,
  Container,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  GraduationCap,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const globalNavItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/facilities", label: "Facilities", icon: Building2 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const facilityNavItems = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "setup", label: "Setup", icon: ClipboardList },
  { href: "profile", label: "Profile", icon: FileText },
  { href: "applicability", label: "Applicability", icon: ClipboardList },
  { href: "assets", label: "Assets", icon: Box },
  { href: "containment", label: "Containment", icon: Container },
  { href: "inspections", label: "Inspections", icon: ClipboardCheck },
  { href: "corrective-actions", label: "Corrective Actions", icon: AlertTriangle },
  { href: "training", label: "Training", icon: GraduationCap },
  { href: "obligations", label: "Obligations", icon: CalendarCheck },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const facilityMatch = pathname.match(/^\/app\/facilities\/([^/]+)/);
  const facilityId = facilityMatch?.[1];
  const navItems = facilityId
    ? facilityNavItems.map((item) => ({
        ...item,
        href: `/app/facilities/${facilityId}${item.href ? `/${item.href}` : ""}`,
      }))
    : globalNavItems;

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--border)] bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-3">
        {!collapsed && (
          <span className="font-serif text-lg font-semibold text-[var(--foreground)]">
            ContainPoint
          </span>
        )}
        <button
          onClick={onToggle}
          className="rounded p-1.5 hover:bg-[var(--mist-gray)] text-[var(--muted)]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/app" ? pathname === "/app" : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--mist-gray)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-[var(--mist-gray)] hover:text-[var(--foreground)]",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
