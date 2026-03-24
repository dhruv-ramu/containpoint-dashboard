"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/facilities", label: "Facilities", icon: Building2 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

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
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
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
