import { renderWorkOrder, replaceBuildPlan } from "@founderos/build";
import { enqueueBuildExecution, getBuildExecution } from "@founderos/db/build-executions";
import { requirePrincipal } from "../../../../../../../lib/auth";
import { getProject, updateProject, writeAuditEvent } from "../../../../../../../lib/store";

export async function GET(request: Request, context: { params: Promise<{ id: string; planId: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id, planId } = await context.params;
  const project = await getProject(id, auth.principal.organizationId);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  const plan = (project.buildPlans ?? []).find((item) => item.id === planId);
  if (!plan) return Response.json({ error: "Build plan not found" }, { status: 404 });
  if (!plan.executionId) return Response.json({ plan, execution: null });
  if (!process.env.DATABASE_URL) return Response.json({ plan, execution: null, error: "DATABASE_URL is required for durable build execution" }, { status: 409 });
  const execution = await getBuildExecution({ projectId: id, organizationId: auth.principal.organizationId, executionId: plan.executionId });
  const refreshed = await getProject(id, auth.principal.organizationId);
  const refreshedPlan = (refreshed?.buildPlans ?? []).find((item) => item.id === planId) ?? plan;
  return Response.json({ plan: refreshedPlan, execution });
}

export async function POST(request: Request, context: { params: Promise<{ id: string; planId: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  if (!process.env.DATABASE_URL) return Response.json({ error: "DATABASE_URL is required for durable build execution" }, { status: 409 });
  const { id, planId } = await context.params;
  const project = await getProject(id, auth.principal.organizationId);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  const plan = (project.buildPlans ?? []).find((item) => item.id === planId);
  if (!plan) return Response.json({ error: "Build plan not found" }, { status: 404 });
  if (!["published", "pr_open"].includes(plan.status)) {
    return Response.json({ error: "Publish the guarded branch before executing code" }, { status: 409 });
  }
  try {
    const execution = await enqueueBuildExecution({
      projectId: id,
      organizationId: auth.principal.organizationId,
      planId,
      repository: plan.repository,
      branchName: plan.branchName,
      baseBranch: plan.baseBranch,
      workOrder: renderWorkOrder(plan)
    });
    const updated = { ...plan, executionId: execution.id, lastError: null };
    await updateProject(id, auth.principal.organizationId, { buildPlans: replaceBuildPlan(project, updated) });
    await writeAuditEvent({
      organizationId: auth.principal.organizationId,
      projectId: id,
      actorUserId: auth.principal.userId,
      eventName: "build.execution_queued",
      properties: { plan_id: planId, execution_id: execution.id, repository: plan.repository, branch: plan.branchName }
    });
    return Response.json({ plan: updated, execution }, { status: execution.status === "queued" ? 202 : 200 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to queue build execution" }, { status: 502 });
  }
}
