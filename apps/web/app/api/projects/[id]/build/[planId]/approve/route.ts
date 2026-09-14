import { approveBuildPlan, replaceBuildPlan } from "@founderos/build";
import { requirePrincipal } from "../../../../../../../lib/auth";
import { getProject, updateProject, writeAuditEvent } from "../../../../../../../lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string; planId: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id, planId } = await context.params;
  const project = await getProject(id, auth.principal.organizationId);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  const plan = (project.buildPlans ?? []).find((item) => item.id === planId);
  if (!plan) return Response.json({ error: "Build plan not found" }, { status: 404 });
  try {
    const approved = approveBuildPlan(plan, auth.principal.userId);
    await updateProject(id, auth.principal.organizationId, { buildPlans: replaceBuildPlan(project, approved) });
    await writeAuditEvent({
      organizationId: auth.principal.organizationId,
      projectId: id,
      actorUserId: auth.principal.userId,
      eventName: "build.plan_approved",
      properties: { plan_id: planId, repository: approved.repository }
    });
    return Response.json(approved);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to approve build plan" }, { status: 409 });
  }
}
