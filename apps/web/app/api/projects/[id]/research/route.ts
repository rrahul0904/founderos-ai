import { createHash } from "node:crypto";
import { enqueueResearch, getProject } from "../../../../../lib/store";
import { requirePrincipal } from "../../../../../lib/auth";

function validPublicUrl(value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1" && host !== "::1" && !host.endsWith(".local");
  } catch { return false; }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id } = await context.params;
  const organizationId = auth.principal.organizationId;
  if (!await getProject(id, organizationId)) return Response.json({ error: "Project not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as { url?: unknown; query?: unknown; claim?: unknown } | null;

  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const claim = typeof body?.claim === "string" ? body.claim.trim().slice(0, 4000) : "";
  if (url) {
    if (!validPublicUrl(url)) return Response.json({ error: "A public http(s) URL is required" }, { status: 400 });
    const key = createHash("sha256").update(id + ":capture:" + url).digest("hex");
    const jobId = await enqueueResearch({ projectId: id, organizationId, kind: "research.capture_url", payload: { url, claim }, idempotencyKey: key });
    return Response.json({ jobId, kind: "research.capture_url" }, { status: 202 });
  }
  if (query.length >= 3 && query.length <= 500) {
    const key = createHash("sha256").update(id + ":search:" + query.toLowerCase()).digest("hex");
    const jobId = await enqueueResearch({ projectId: id, organizationId, kind: "research.search", payload: { query }, idempotencyKey: key });
    return Response.json({ jobId, kind: "research.search", provider: process.env.TAVILY_API_KEY ? "tavily" : "unconfigured" }, { status: 202 });
  }
  return Response.json({ error: "Provide either url or query" }, { status: 400 });
}
