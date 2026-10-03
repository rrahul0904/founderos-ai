import { runQuickValidation, type DomainStatus, type QuickNameIdea } from "@founderos/agents";

export const runtime = "nodejs";

async function checkComDomain(domain: string): Promise<DomainStatus> {
  if (!/^[a-z0-9-]+\.com$/i.test(domain)) return "unknown";
  try {
    const response = await fetch(`https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(domain)}`, {
      headers: { accept: "application/rdap+json" },
      redirect: "manual",
      signal: AbortSignal.timeout(2500),
      cache: "no-store"
    });
    if (response.status === 404) return "available";
    if (response.ok) return "registered";
    return "unknown";
  } catch {
    return "unknown";
  }
}

async function enrichDomains(items: QuickNameIdea[]) {
  return Promise.all(items.map(async (item) => ({ ...item, status: await checkComDomain(item.domain) })));
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) return Response.json({ error: "Request is too large." }, { status: 413 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Expected a JSON request body." }, { status: 400 }); }

  const idea = typeof body === "object" && body !== null && "idea" in body ? (body as { idea?: unknown }).idea : undefined;
  if (typeof idea !== "string") return Response.json({ error: "idea must be a string." }, { status: 400 });

  try {
    const result = await runQuickValidation(idea);
    const nameIdeas = await enrichDomains(result.nameIdeas);
    return Response.json({ ...result, nameIdeas }, { headers: { "cache-control": "no-store" } });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not validate this idea.";
    return Response.json({ error: message }, { status: 400, headers: { "cache-control": "no-store" } });
  }
}
