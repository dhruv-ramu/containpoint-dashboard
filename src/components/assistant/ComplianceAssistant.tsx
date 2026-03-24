"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart } from "ai";
import { useMemo, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square, Sparkles, Loader2 } from "lucide-react";

export function ComplianceAssistant({ facilityId }: { facilityId: string }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/facilities/${facilityId}/assistant/chat`,
      }),
    [facilityId]
  );

  const { messages, sendMessage, status, stop, error } = useChat({ transport });

  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    await sendMessage({ text: t });
  }

  return (
    <div className="flex flex-col h-[min(720px,calc(100vh-12rem))] rounded-xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--mist-gray)]/50">
        <Sparkles className="h-5 w-5 text-[var(--steel-blue)] shrink-0" />
        <div>
          <h2 className="font-serif text-lg font-semibold text-[var(--foreground)]">
            Compliance assistant
          </h2>
          <p className="text-xs text-[var(--muted)]">
            OpenAI + RAG over indexed docs; uses live facility data via tools. Not legal advice.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)] space-y-2">
            <p className="font-medium text-[var(--foreground)]">Try asking:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>What inspections are coming up for this facility?</li>
              <li>Summarize our SPCC applicability and qualification status.</li>
              <li>What does SPCC require for personnel training?</li>
              <li>What open corrective actions do we have?</li>
            </ul>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-lg bg-[var(--steel-blue)]/10 px-4 py-3 text-sm"
                : "mr-8 rounded-lg bg-[var(--mist-gray)] px-4 py-3 text-sm"
            }
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
              {m.role === "user" ? "You" : "Assistant"}
            </p>
            <div className="space-y-2 text-[var(--foreground)] leading-relaxed">
              {m.parts?.map((part, i) => {
                if (isTextUIPart(part)) {
                  return (
                    <p key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking…
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error.message}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="p-4 border-t border-[var(--border)] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about SPCC or this facility…"
          disabled={busy}
          className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--steel-blue)]/25"
        />
        {busy ? (
          <Button type="button" variant="outline" onClick={() => stop()}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
