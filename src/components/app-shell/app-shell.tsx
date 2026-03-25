"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { AssistantFab } from "@/components/assistant/AssistantFab";

type Facility = { id: string; name: string };

export function AppShell({
  children,
  orgName,
  userName,
  facilities,
}: {
  children: React.ReactNode;
  orgName: string;
  userName?: string | null;
  userEmail?: string | null;
  facilities: Facility[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const match = pathname.match(/^\/app\/facilities\/([^/]+)/);
  const currentFacilityId = match ? match[1] : null;

  return (
    <div className="flex h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar
          orgName={orgName}
          userName={userName}
          facilities={facilities}
          currentFacilityId={currentFacilityId}
        />
        <main className="flex-1 overflow-auto bg-[var(--bone)] p-6">
          {children}
        </main>
        <AssistantFab facilityId={currentFacilityId} facilities={facilities} />
      </div>
    </div>
  );
}
