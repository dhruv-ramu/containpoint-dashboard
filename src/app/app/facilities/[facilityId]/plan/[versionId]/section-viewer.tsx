"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

type Section = {
  id: string;
  sectionKey: string;
  title: string;
  narrativeText: string | null;
  structuredDataJson: unknown;
  contentMode: string;
  generatedFromSystem: boolean;
};

export function SectionViewer({
  facilityId,
  versionId,
  section,
  canEdit,
}: {
  facilityId: string;
  versionId: string;
  section: Section;
  canEdit: boolean;
}) {
  const [narrativeText, setNarrativeText] = useState(section.narrativeText ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNarrativeText(section.narrativeText ?? "");
  }, [section.id, section.narrativeText]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/plan/versions/${versionId}/sections/${section.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ narrativeText }),
        }
      );
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert("Failed to save section");
    } finally {
      setSaving(false);
    }
  }

  const structuredData = section.structuredDataJson as Record<string, unknown> | null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{section.title}</h2>
        {canEdit && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            variant={saved ? "secondary" : "default"}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </Button>
        )}
      </div>

      {section.generatedFromSystem && structuredData && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--mist-gray)]/30 p-4 text-sm">
          <p className="text-[var(--muted)] mb-2">
            This section is partially generated from system data.
          </p>
          <pre className="whitespace-pre-wrap overflow-x-auto text-xs">
            {JSON.stringify(structuredData, null, 2)}
          </pre>
        </div>
      )}

      {canEdit ? (
        <Textarea
          value={narrativeText}
          onChange={(e) => setNarrativeText(e.target.value)}
          placeholder="Enter narrative content for this section…"
          rows={12}
          className="font-sans text-sm"
        />
      ) : (
        <div className="prose prose-sm max-w-none">
          {narrativeText ? (
            <div className="whitespace-pre-wrap">{narrativeText}</div>
          ) : (
            <p className="text-[var(--muted)]">No narrative content</p>
          )}
        </div>
      )}
    </div>
  );
}
