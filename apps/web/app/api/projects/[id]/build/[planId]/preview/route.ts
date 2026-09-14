import { replaceBuildPlan } from "@founderos/build";
import { VercelPreviewClient } from "@founderos/deployments";
import { enqueuePreviewVerification, getPreviewVerification } from "@founderos/db/preview-verifications";
import type { PreviewBrowserReport } from "@founderos/core";
import { requirePrincipal } from "../../../../../../../lib/auth";
import { getProject, updateProject, writeAuditEvent } from "../../../../../../../lib/store";

function browserReport(value: Record<string, unknown>): PreviewBrowserReport | undefined {
  if (typeof value.statusCode !== "number" || typeof value.finalUrl !== "string" || typeof value.title !== "string" || typeof value.bodyTextLength !== "number" || typeof value.checkedAt !== "string") return undefined;
  return {
    statusCode: value.statusCode,
    finalUrl: value.finalUrl,
    title: value.title,
    bodyTextLength: value.bodyTextLength,
    consoleErrors: Array.isArray(value.consoleErrors) ? value.consoleErrors.filter((item): item is string => typeof item === "string") : [],
    pageErrors: Array.isArray(value.pageErrors) ? value.pageErrors.filter((item): item is string => typeof item === "string") : [],
    checkedAt: value.checkedAt
  };
}

export async function GET(request: Request, context: { params: Promise<{ id: string; planId: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id, planId } = await context.params;
  const project = await getProject(id, auth.principal.organizationId);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  const plan = (project.buildPlans ?? []).find((item) => item.id === planId);
  if (!plan) return Response.json({ error: "Build plan not found" }, { status: 404 });
  if (!plan.preview?.verificationId) return Response.json({ plan, verification: null });
  if (!process.env.DATABASE_URL) return Response.json({ error: "DATABASE_URL is required for preview verification", plan }, { status: 409 });
  const verification = await getPreviewVerification({ projectId: id, organizationId: auth.principal.organizationId, verificationId: plan.preview.verificationId });
  if (!verification) return Response.json({ error: "Preview verification not found", plan }, { status: 404 });

  let updated = plan;
  if (verification.status === "passed") {
    updated = {
      ...plan,
      lastError: null,
      preview: { ...plan.preview, verificationStatus: "passed", browserReport: browserReport(verification.report) }
    };
  } else if (verification.status === "failed") {
    updated = {
      ...plan,
      lastError: verification.lastError || "Preview browser verification failed",
      preview: { ...plan.preview, verificationStatus: "failed" }
    };
  } else if (plan.preview.verificationStatus !== verification.status) {
    updated = { ...plan, preview: { ...plan.preview, verificationStatus: verification.status } };
  }
  if (updated !== plan) await updateProject(id, auth.principal.organizationId, { buildPlans: replaceBuildPlan(project, updated) });
  return Response.json({ plan: updated, verification });
}

export async function POST(request: Request, context: { params: Promise<{ id: string; planId: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id, planId } = await context.params;
  const project = await getProject(id, auth.principal.organizationId);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  const plan = (project.buildPlans ?? []).find((item) => item.id === planId);
  if (!plan) return Response.json({ error: "Build plan not found" }, { status: 404 });
  if (!plan.executionCommit || plan.verification?.status !== "passed" || !plan.releaseEvidence) {
    return Response.json({ error: "A verified execution commit and release-evidence manifest are required before preview verification" }, { status: 409 });
  }
  const body = await request.json().catch(() => null) as { teamId?: unknown; projectId?: unknown } | null;
  const teamId = typeof body?.teamId === "string" ? body.teamId.trim() : "";
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  if (!teamId || !projectId) return Response.json({ error: "Vercel teamId and projectId are required" }, { status: 400 });

  try {
    const client = VercelPreviewClient.fromEnv();
    const deployment = await client.findExactPreview({ teamId, projectId, commitSha: plan.executionCommit, branch: plan.branchName });
    const basePreview = { provider: "vercel" as const, teamId, projectId };
    if (!deployment) {
      const updated = { ...plan, lastError: "No Vercel preview found for the exact verified commit and guarded branch", preview: basePreview };
      await updateProject(id, auth.principal.organizationId, { buildPlans: replaceBuildPlan(project, updated) });
      await writeAuditEvent({ organizationId: auth.principal.organizationId, projectId: id, actorUserId: auth.principal.userId, eventName: "preview.waiting", properties: { plan_id: planId, provider: "vercel", vercel_project_id: projectId, commit: plan.executionCommit } });
      return Response.json({ plan: updated, deployment: null, verification: null }, { status: 202 });
    }

    const record = { ...deployment, teamId, projectId, discoveredAt: new Date().toISOString() };
    if (deployment.state !== "READY") {
      const terminal = ["ERROR", "CANCELED"].includes(deployment.state.toUpperCase());
      const updated = { ...plan, lastError: terminal ? `Vercel preview is ${deployment.state}` : null, preview: { ...basePreview, deployment: record } };
      await updateProject(id, auth.principal.organizationId, { buildPlans: replaceBuildPlan(project, updated) });
      return Response.json({ plan: updated, deployment: record, verification: null }, { status: terminal ? 409 : 202 });
    }

    if (!process.env.DATABASE_URL) {
      const updated = { ...plan, lastError: "DATABASE_URL is required to queue browser verification", preview: { ...basePreview, deployment: record } };
      await updateProject(id, auth.principal.organizationId, { buildPlans: replaceBuildPlan(project, updated) });
      return Response.json({ error: updated.lastError, plan: updated }, { status: 409 });
    }
    const verification = await enqueuePreviewVerification({ projectId: id, organizationId: auth.principal.organizationId, planId, provider: "vercel", deploymentId: deployment.deploymentId, deploymentUrl: deployment.url, expectedCommitSha: plan.executionCommit });
    const updated = { ...plan, lastError: null, preview: { ...basePreview, deployment: record, verificationId: verification.id, verificationStatus: verification.status } };
    await updateProject(id, auth.principal.organizationId, { buildPlans: replaceBuildPlan(project, updated) });
    await writeAuditEvent({ organizationId: auth.principal.organizationId, projectId: id, actorUserId: auth.principal.userId, eventName: "preview.browser_queued", properties: { plan_id: planId, provider: "vercel", deployment_id: deployment.deploymentId, verification_id: verification.id, commit: plan.executionCommit } });
    return Response.json({ plan: updated, deployment: record, verification }, { status: verification.status === "queued" ? 202 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview discovery failed";
    const updated = { ...plan, lastError: message };
    await updateProject(id, auth.principal.organizationId, { buildPlans: replaceBuildPlan(project, updated) }).catch(() => undefined);
    return Response.json({ error: message, plan: updated }, { status: 502 });
  }
}
