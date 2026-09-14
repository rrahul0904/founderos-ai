import { renderWorkOrder } from "@founderos/build";
import { requirePrincipal } from "../../../../../../../lib/auth";
import { getProject } from "../../../../../../../lib/store";

export async function GET(request: Request, context: { params: Promise<{ id: string; planId: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id, planId } = await context.params;
  const project = await getProject(id, auth.principal.organizationId);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  const plan = (project.buildPlans ?? []).find((item) => item.id === planId);
  if (!plan) return Response.json({ error: "Build plan not found" }, { status: 404 });
  return new Response(renderWorkOrder(plan), { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
