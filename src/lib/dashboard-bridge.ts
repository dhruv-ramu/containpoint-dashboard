import { createHmac, timingSafeEqual } from "node:crypto";

export type DashboardBridgePayload = {
  v: 1;
  facilityId: string;
  targetUserId: string;
  staffId: string;
  iat: number;
  exp: number;
};

/** Same algorithm as admin app — keep payloads in sync. */
export function verifyDashboardBridgeToken(token: string): DashboardBridgePayload | null {
  const s = process.env.ADMIN_DASHBOARD_BRIDGE_SECRET;
  if (!s || s.length < 32) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expected = createHmac("sha256", s).update(payloadB64).digest("base64url");
  try {
    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }

  let payload: DashboardBridgePayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (payload.v !== 1) return null;
  if (
    typeof payload.facilityId !== "string" ||
    typeof payload.targetUserId !== "string" ||
    typeof payload.staffId !== "string"
  ) {
    return null;
  }
  if (typeof payload.exp !== "number" || Math.floor(Date.now() / 1000) > payload.exp) return null;
  return payload;
}
