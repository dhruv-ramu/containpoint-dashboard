"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function AssistantMarkdown({
  text,
  className,
  hideMarkdownImages,
}: {
  text: string;
  className?: string;
  /** Avoid broken <img> when the model emits placeholder ![alt](url); diagrams use the diagram tool instead. */
  hideMarkdownImages?: boolean;
}) {
  return (
    <div
      className={cn(
        "assistant-md font-serif text-[var(--foreground)] text-sm leading-relaxed",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-2 list-disc pl-5 space-y-1 first:mt-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal pl-5 space-y-1 first:mt-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => (
            <h3 className="font-serif text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="font-serif text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="font-serif text-sm font-semibold mt-2 mb-1">{children}</h4>
          ),
          code: ({ className: codeClass, children }) => {
            const inline = !codeClass;
            if (inline) {
              return (
                <code className="rounded bg-[var(--mist-gray)] px-1 py-0.5 font-mono text-[0.85em]">
                  {children}
                </code>
              );
            }
            return (
              <code className="block rounded-lg bg-[var(--mist-gray)] p-3 font-mono text-xs overflow-x-auto my-2">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[var(--steel-blue)]/40 pl-3 my-2 text-[var(--muted)] italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--steel-blue)] underline underline-offset-2 hover:opacity-90"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[var(--mist-gray)]">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-[var(--border)] px-2 py-1.5 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-[var(--border)] px-2 py-1.5 align-top">{children}</td>
          ),
          hr: () => <hr className="my-4 border-[var(--border)]" />,
          img: hideMarkdownImages
            ? () => null
            : ({ src, alt }) => (
                <>
                  {/* User-supplied URLs; next/image would require remotePatterns per host. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={alt ?? ""}
                    className="my-2 max-w-full rounded-lg border border-[var(--border)]"
                    loading="lazy"
                  />
                </>
              ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
