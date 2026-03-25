"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isTextUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { useMemo, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { AssistantDiagram } from "./AssistantDiagramCatalog";

/** When the model calls renderComplianceDiagram then writes text, parts are often [diagram, text]; show text first. */
function orderedAssistantParts(parts: UIMessage["parts"] | undefined) {
  if (!parts?.length) return parts ?? [];
  const firstText = parts.findIndex(isTextUIPart);
  const firstDiagram = parts.findIndex(
    (p) => isToolUIPart(p) && getToolName(p) === "renderComplianceDiagram"
  );
  if (firstText === -1 || firstDiagram === -1 || firstDiagram >= firstText) {
    return parts;
  }
  const texts = parts.filter(isTextUIPart);
  const diagrams = parts.filter(
    (p) => isToolUIPart(p) && getToolName(p) === "renderComplianceDiagram"
  );
  return [...texts, ...diagrams];
}

export function ComplianceAssistant({
  facilityId,
  embedded,
  className,
}: {
  facilityId: string;
  embedded?: boolean;
  className?: string;
}) {
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
    <div
      className={cn(
        "flex flex-col overflow-hidden",
        embedded
          ? "h-full min-h-0 rounded-none border-0 bg-transparent shadow-none"
          : "h-[min(720px,calc(100vh-12rem))] rounded-xl border border-[var(--border)] bg-white shadow-sm",
        className
      )}
    >
      {!embedded && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--mist-gray)]/50 shrink-0">
          <Sparkles className="h-5 w-5 text-[var(--steel-blue)] shrink-0" />
          <div>
            <h2 className="font-serif text-lg font-semibold text-[var(--foreground)]">
              Compliance assistant
            </h2>
            <p className="text-xs text-[var(--muted)]">
              OpenAI + RAG (markdown + master docs); live facility data via tools. Not legal advice.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)] space-y-2">
            <p className="font-medium text-[var(--foreground)]">Try asking:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>What inspections are coming up for this facility?</li>
              <li>Summarize our SPCC applicability and qualification status.</li>
              <li>Walk me through secondary containment concepts with a diagram.</li>
              <li>What open corrective actions do we have?</li>
            </ul>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-6 sm:ml-10 rounded-lg bg-[var(--steel-blue)]/10 px-4 py-3 text-sm"
                : "mr-4 sm:mr-8 rounded-lg bg-[var(--mist-gray)] px-4 py-3 text-sm"
            }
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
              {m.role === "user" ? "You" : "Assistant"}
            </p>
            <div className="space-y-2 text-[var(--foreground)] leading-relaxed">
              {(m.role === "assistant" ? orderedAssistantParts(m.parts) : m.parts)?.map((part, i) => {
                if (isTextUIPart(part)) {
                  return (
                    <AssistantMarkdown
                      key={`t-${i}`}
                      text={part.text}
                      className={m.role === "user" ? "font-sans" : undefined}
                      hideMarkdownImages={m.role === "assistant"}
                    />
                  );
                }
                if (isToolUIPart(part)) {
                  const name = getToolName(part);
                  if (name !== "renderComplianceDiagram") {
                    return null;
                  }
                  if (part.state === "output-available") {
                    const out = part.output as { diagramId?: string; caption?: string };
                    if (out?.diagramId) {
                      return (
                        <AssistantDiagram
                          key={part.toolCallId ?? i}
                          diagramId={out.diagramId}
                          caption={out.caption}
                        />
                      );
                    }
                  }
                  if (part.state === "output-error") {
                    return (
                      <p key={part.toolCallId ?? i} className="text-red-600 text-xs">
                        Could not render diagram.
                      </p>
                    );
                  }
                  return (
                    <div
                      key={part.toolCallId ?? i}
                      className="flex items-center gap-2 text-xs text-[var(--muted)] py-1"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      Preparing diagram…
                    </div>
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

      <form
        onSubmit={onSubmit}
        className="p-4 border-t border-[var(--border)] flex gap-2 shrink-0 bg-white"
      >
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
