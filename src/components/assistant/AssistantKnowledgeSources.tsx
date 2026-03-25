"use client";

type Source = { title: string; file: string; relevance: number };

export function AssistantKnowledgeSources({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null;
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-white/90 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
        Retrieved sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s, i) => (
          <span
            key={`${s.file}-${i}`}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--mist-gray)]/60 px-2.5 py-1 text-xs text-[var(--foreground)]"
            title={`${s.file} · score ${s.relevance}`}
          >
            <span className="truncate max-w-[200px]">{s.title}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
