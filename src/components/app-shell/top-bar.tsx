"use client";

import { signOut } from "next-auth/react";
import { FacilitySwitcher } from "./facility-switcher";
import { Button } from "@/components/ui/button";

type Facility = { id: string; name: string };

export function TopBar({
  orgName,
  userName,
  facilities,
  currentFacilityId,
}: {
  orgName: string;
  userName?: string | null;
  facilities: Facility[];
  currentFacilityId: string | null;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-white px-4">
      <div className="flex items-center gap-6">
        <span className="text-sm text-[var(--muted)]">{orgName}</span>
        <FacilitySwitcher
          facilities={facilities}
          currentFacilityId={currentFacilityId}
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[var(--muted)]">{userName ?? "User"}</span>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
