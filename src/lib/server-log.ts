/**
 * One-line JSON logs for production-friendly grepping (e.g. Vercel / Docker).
 * Safe for server components, route handlers, and server actions only.
 */
export function logServerStructured(
  event: string,
  data: Record<string, unknown> = {}
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...data,
  });
  console.log(line);
}
