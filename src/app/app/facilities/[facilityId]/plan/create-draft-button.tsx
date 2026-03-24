"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CreateDraftVersionButton({ facilityId }: { facilityId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/plan/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create draft");
      }
      const { version } = await res.json();
      router.push(`/app/facilities/${facilityId}/plan/${version.id}`);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to create draft");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleCreate} disabled={loading}>
      <Plus className="h-4 w-4" />
      {loading ? "Creating…" : "New draft version"}
    </Button>
  );
}
