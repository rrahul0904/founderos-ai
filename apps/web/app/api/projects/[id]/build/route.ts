import { generateBuildPlan } from "@founderos/build";
import { requirePrincipal } from "../../../../../lib/auth";
import { getProject, updateProject, writeAuditEvent } from "../../../../../lib/store";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id } = await context.params;
  const project = await getProject(id, auth.principal.organizationId);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  return Response.json(project.buildPlans ?? []);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id } = await context.params;
  const project = await getProject(id, auth.principal.organizationId);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as { repository?: unknown; objective?: unknown; baseBranch?: unknown } | null;
  const repository = typeof body?.repository === "string" ? body.repository.trim() : "";
  const objective = typeof body?.objective === "string" ? body.objective.trim() : undefined;
  const baseBranch = typeof body?.baseBranch === "string" ? body.baseBranch.trim() : undefined;
  if (!repository) return Response.json({ error: "repository is required" }, { status: 400 });
  try {
    const plan = generateBuildPlan(project, { repository, objective, baseBranch });
    const buildPlans = [plan, ...(project.buildPlans ?? [])].slice(0, 25);
    await updateProject(id, auth.principal.organizationId, { buildPlans });
    await writeAuditEvent({
      organizationId: auth.principal.organizationId,
      projectId: id,
      actorUserId: auth.principal.userId,
      eventName: "build.plan_created",
      properties: { plan_id: plan.id, repository: plan.repository, branch: plan.branchName }
    });
    return Response.json(plan, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create build plan" }, { status: 400 });
  }
}
