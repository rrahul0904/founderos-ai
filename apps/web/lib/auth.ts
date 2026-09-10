import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { DEV_ORGANIZATION_ID, DEV_USER_ID } from "@founderos/core";

export interface Principal {
  userId: string;
  organizationId: string;
  role: "owner";
}

function safeEqual(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

function configuredKey() { return process.env.FOUNDEROS_API_KEY?.trim() || null; }

export async function getPrincipal(request?: Request): Promise<Principal | null> {
  const mode = process.env.AUTH_MODE ?? "dev";
  if (mode === "dev") {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_AUTH !== "true") return null;
    return { userId: DEV_USER_ID, organizationId: process.env.FOUNDEROS_ORG_ID || DEV_ORGANIZATION_ID, role: "owner" };
  }
  if (mode !== "shared-key") return null;
  const expected = configuredKey();
  if (!expected) return null;
  const bearer = request?.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("founderos_session")?.value ?? null;
  const token = bearer || cookieToken;
  if (!token || !safeEqual(token, expected)) return null;
  return { userId: DEV_USER_ID, organizationId: process.env.FOUNDEROS_ORG_ID || DEV_ORGANIZATION_ID, role: "owner" };
}

export async function requirePrincipal(request?: Request) {
  const principal = await getPrincipal(request);
  if (!principal) return { principal: null, response: Response.json({ error: "Authentication required" }, { status: 401 }) };
  return { principal, response: null };
}

export function authMode() { return process.env.AUTH_MODE ?? "dev"; }
