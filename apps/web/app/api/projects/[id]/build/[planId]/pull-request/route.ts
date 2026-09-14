import { renderWorkOrder, replaceBuildPlan } from "@founderos/build";
import { GitHubDeliveryClient } from "@founderos/github";
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
  if (!["published", "pr_open"].includes(plan.status)) {
    return Response.json({ error: "Publish the build plan before opening a pull request" }, { status: 409 });
  }

  try {
    const github = GitHubDeliveryClient.fromEnv();
    await github.verifyRepository(plan.repository);
    const issueLinks = plan.tasks
      .filter((task) => task.githubIssue)
      .map((task) => `- #${task.githubIssue!.number}: ${task.githubIssue!.url}`)
      .join("\n");
    const pull = await github.ensurePullRequest(plan.repository, {
      head: plan.branchName,
      base: plan.baseBranch,
      title: `feat: ${plan.objective}`,
      body: [
        "## FounderOS delivery",
        "",
        `Approved build plan: \`${plan.id}\``,
        `Working branch: \`${plan.branchName}\``,
        "",
        "### Implementation issues",
        issueLinks || "- No linked implementation issues.",
        "",
        renderWorkOrder(plan),
        "",
        "_This draft PR was opened by FounderOS. Merge remains a human/repository-policy decision._"
      ].join("\n")
    });
    const updated = { ...plan, status: "pr_open" as const, pullRequest: pull, lastError: null };
    await updateProject(id, auth.principal.organizationId, { buildPlans: replaceBuildPlan(project, updated) });
    await writeAuditEvent({
      organizationId: auth.principal.organizationId,
      projectId: id,
      actorUserId: auth.principal.userId,
      eventName: "build.pull_request_opened",
      properties: { plan_id: planId, repository: plan.repository, pull_request: pull.number }
    });
    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open pull request";
    const updated = { ...plan, lastError: message.slice(0, 1000) };
    await updateProject(id, auth.principal.organizationId, { buildPlans: replaceBuildPlan(project, updated) }).catch(() => undefined);
    return Response.json({ error: message, plan: updated }, { status: 502 });
  }
}
