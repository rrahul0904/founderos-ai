import { getProject, listAudit } from "../../../../../lib/store";
import { requirePrincipal } from "../../../../../lib/auth";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id } = await context.params;
  if (!await getProject(id, auth.principal.organizationId)) return Response.json({ error: "Project not found" }, { status: 404 });
  return Response.json(await listAudit(id, auth.principal.organizationId));
}
