"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Facility = { id: string; name: string };

export function FacilitySwitcher({
  facilities,
  currentFacilityId,
}: {
  facilities: Facility[];
  currentFacilityId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (facilities.length === 0) {
    return <div className="text-sm text-[var(--muted)]">No facilities</div>;
  }

  const handleChange = (facilityId: string) => {
    if (facilityId === "__all__") {
      router.push("/app");
      return;
    }
    const match = pathname.match(/^\/app\/facilities\/([^/]+)/);
    if (match) {
      const newPath = pathname.replace(match[1], facilityId);
      router.push(newPath);
    } else {
      router.push(`/app/facilities/${facilityId}`);
    }
  };

  const value = currentFacilityId ?? "__all__";

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px] border-0 bg-transparent shadow-none focus:ring-0">
        <SelectValue placeholder="Select facility" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All facilities</SelectItem>
        {facilities.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
