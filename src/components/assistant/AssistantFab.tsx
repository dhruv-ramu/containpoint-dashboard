"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ComplianceAssistant } from "./ComplianceAssistant";

type Facility = { id: string; name: string };

export function AssistantFab({
  facilityId,
  facilities,
}: {
  facilityId: string | null;
  facilities: Facility[];
}) {
  const [open, setOpen] = useState(false);
  const [showLabel, setShowLabel] = useState(true);
  const [pickerFacilityId, setPickerFacilityId] = useState<string | null>(null);

  const defaultId = facilityId ?? facilities[0]?.id ?? "";
  const effectiveId = pickerFacilityId ?? defaultId;

  useEffect(() => {
    const t = window.setTimeout(() => setShowLabel(false), 3400);
    return () => window.clearTimeout(t);
  }, []);

  if (!defaultId || facilities.length === 0) {
    return null;
  }

  const facilityName =
    facilities.find((f) => f.id === effectiveId)?.name ?? "Facility";
  const showFacilityPicker = facilities.length > 1;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "group pointer-events-auto flex items-center rounded-full border border-[var(--border)] bg-white shadow-md transition-all duration-300 ease-out hover:shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--steel-blue)]/35",
            showLabel
              ? "gap-2 pl-3.5 pr-3 py-2.5"
              : "p-3 group-hover:gap-2 group-hover:pl-3.5 group-hover:pr-3 group-hover:py-2.5"
          )}
          aria-label="Open AI Assistant"
          aria-expanded={open}
        >
          <Sparkles className="h-5 w-5 text-[var(--steel-blue)] shrink-0" aria-hidden />
          <span
            className={cn(
              "font-serif text-sm font-semibold text-[var(--foreground)] whitespace-nowrap transition-all duration-300 ease-out",
              showLabel
                ? "opacity-100 max-w-[130px] translate-x-0"
                : "opacity-0 max-w-0 -translate-x-0.5 overflow-hidden group-hover:opacity-100 group-hover:max-w-[130px] group-hover:translate-x-0"
            )}
          >
            AI Assistant
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "flex flex-col gap-0 overflow-hidden p-0 rounded-xl",
            "fixed left-auto top-4 right-4 translate-x-0 translate-y-0",
            "h-[min(100dvh-2rem,840px)] w-[min(100vw-1.5rem,440px)] max-w-[calc(100vw-1.5rem)]",
            "data-[state=open]:slide-in-from-right-4 data-[state=closed]:slide-out-to-right-4",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          )}
        >
          <DialogClose
            className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-[var(--muted)] opacity-80 transition-opacity hover:opacity-100 hover:bg-[var(--mist-gray)] focus:outline-none focus:ring-2 focus:ring-[var(--steel-blue)]/25"
            aria-label="Close assistant"
          >
            <X className="h-4 w-4" />
          </DialogClose>
          <DialogHeader className="px-4 py-3 border-b border-[var(--border)] shrink-0 text-left space-y-0.5 pr-12">
            <DialogTitle>Compliance assistant</DialogTitle>
            {showFacilityPicker ? (
              <div className="pt-2 space-y-1.5">
                <Label htmlFor="assistant-facility" className="text-xs text-[var(--muted)]">
                  Facility context
                </Label>
                <Select
                  value={effectiveId}
                  onValueChange={(v) => setPickerFacilityId(v)}
                >
                  <SelectTrigger id="assistant-facility" className="h-9 text-sm">
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] font-normal pt-0.5">{facilityName}</p>
            )}
            {!facilityId && !showFacilityPicker ? (
              <p className="text-xs text-[var(--muted)] font-normal">
                Open a facility from the top bar for URL-scoped context.
              </p>
            ) : null}
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col px-0 pb-0">
            <ComplianceAssistant key={effectiveId} facilityId={effectiveId} embedded />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
