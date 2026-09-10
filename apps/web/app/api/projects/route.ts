import { addProject, listProjects } from "../../../lib/store";
import { requirePrincipal } from "../../../lib/auth";

export async function GET(request: Request) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  return Response.json(await listProjects(auth.principal.organizationId));
}

export async function POST(request: Request) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const body = await request.json().catch(() => null) as { idea?: unknown } | null;
  const idea = typeof body?.idea === "string" ? body.idea.trim() : "";
  if (idea.length < 20 || idea.length > 5000) {
    return Response.json({ error: "Idea must be between 20 and 5000 characters." }, { status: 400 });
  }
  return Response.json(await addProject(idea, auth.principal.organizationId), { status: 201 });
}
