/** Avoid open redirects: only same-origin relative paths under /app. */
export function safeAppCallbackUrl(raw: string | null | undefined, fallback = "/app"): string {
  if (!raw || typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (!raw.startsWith("/app")) return fallback;
  return raw;
}
