import { addEvidence, getProject, listEvidence } from "../../../../../lib/store";
import { requirePrincipal } from "../../../../../lib/auth";
import type { EvidenceSourceType } from "@founderos/core";

const sourceTypes = new Set<EvidenceSourceType>(["manual", "web", "search", "interview", "telemetry"]);

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id } = await context.params;
  if (!await getProject(id, auth.principal.organizationId)) return Response.json({ error: "Project not found" }, { status: 404 });
  return Response.json(await listEvidence(id, auth.principal.organizationId));
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id } = await context.params;
  if (!await getProject(id, auth.principal.organizationId)) return Response.json({ error: "Project not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const claim = typeof body?.claim === "string" ? body.claim.trim() : "";
  if (claim.length < 5 || claim.length > 4000) return Response.json({ error: "Claim must be 5-4000 characters" }, { status: 400 });
  const sourceType = sourceTypes.has(body?.sourceType as EvidenceSourceType) ? body?.sourceType as EvidenceSourceType : "manual";
  const sourceUrl = typeof body?.sourceUrl === "string" && body.sourceUrl.trim() ? body.sourceUrl.trim() : null;
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 500) : null;
  const excerpt = typeof body?.excerpt === "string" ? body.excerpt.trim().slice(0, 12000) : null;
  const confidence = typeof body?.confidence === "number" ? body.confidence : 0.6;
  const evidence = await addEvidence({ projectId: id, organizationId: auth.principal.organizationId, sourceType, sourceUrl, title, claim, excerpt, confidence });
  return Response.json(evidence, { status: 201 });
}
