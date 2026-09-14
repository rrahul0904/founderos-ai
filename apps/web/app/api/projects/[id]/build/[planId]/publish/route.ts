import { renderTaskIssueBody, replaceBuildPlan } from "@founderos/build";
import { GitHubDeliveryClient } from "@founderos/github";
import { readinessForStage, type BuildPlanRecord } from "@founderos/core";
import { requirePrincipal } from "../../../../../../../lib/auth";
import { getProject, updateProject, writeAuditEvent } from "../../../../../../../lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string; planId: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id, planId } = await context.params;
  const project = await getProject(id, auth.principal.organizationId);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  const original = (project.buildPlans ?? []).find((item) => item.id === planId);
  if (!original) return Response.json({ error: "Build plan not found" }, { status: 404 });
  if (!original.approvedAt || !["approved", "publishing", "blocked"].includes(original.status)) {
    return Response.json({ error: "Build plan must be approved before GitHub publication" }, { status: 409 });
  }

  let working: BuildPlanRecord = { ...original, status: "publishing", lastError: null };
  const persist = async () => {
    await updateProject(id, auth.principal!.organizationId, { buildPlans: replaceBuildPlan(project, working) });
  };

  try {
    const github = GitHubDeliveryClient.fromEnv();
    await github.verifyRepository(working.repository);
    await github.createBranch(working.repository, working.branchName, working.baseBranch);
    working = { ...working, branchCreatedAt: working.branchCreatedAt ?? new Date().toISOString() };
    await persist();

    for (const item of [...working.tasks].sort((a, b) => a.order - b.order)) {
      if (item.githubIssue) continue;
      const issue = await github.ensureIssue(
        working.repository,
        `[FounderOS ${working.id.slice(0, 8)}] ${item.order}. ${item.title}`,
        renderTaskIssueBody(working, item)
      );
      working = {
        ...working,
        tasks: working.tasks.map((task) => task.id === item.id
          ? { ...task, status: "issue_created", githubIssue: issue }
          : task)
      };
      await persist();
    }

    working = { ...working, status: "published", publishedAt: new Date().toISOString(), lastError: null };
    await updateProject(id, auth.principal.organizationId, {
      buildPlans: replaceBuildPlan(project, working),
      stage: "build",
      readiness: readinessForStage("build")
    });
    await writeAuditEvent({
      organizationId: auth.principal.organizationId,
      projectId: id,
      actorUserId: auth.principal.userId,
      eventName: "build.plan_published",
      properties: {
        plan_id: planId,
        repository: working.repository,
        branch: working.branchName,
        issue_count: working.tasks.filter((task) => task.githubIssue).length
      }
    });
    return Response.json(working);
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub publication failed";
    working = { ...working, status: "blocked", lastError: message.slice(0, 1000) };
    await persist().catch(() => undefined);
    await writeAuditEvent({
      organizationId: auth.principal.organizationId,
      projectId: id,
      actorUserId: auth.principal.userId,
      eventName: "build.plan_blocked",
      properties: { plan_id: planId, repository: working.repository, error: message.slice(0, 500) }
    }).catch(() => undefined);
    return Response.json({ error: message, plan: working }, { status: 502 });
  }
}
