import { cookies } from "next/headers";
import { authMode, validateAccessKey } from "../../../../lib/auth";

export async function POST(request: Request) {
  if (authMode() !== "shared-key") return Response.json({ ok: true, mode: authMode() });
  const body = await request.json().catch(() => null) as { key?: unknown } | null;
  const key = typeof body?.key === "string" ? body.key.trim() : "";
  if (!validateAccessKey(key)) return Response.json({ error: "Invalid access key" }, { status: 401 });
  const store = await cookies();
  store.set("founderos_session", key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/"
  });
  return Response.json({ ok: true });
}
