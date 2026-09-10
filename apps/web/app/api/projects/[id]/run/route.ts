import { runAgent, type AgentName } from "@founderos/agents";
import { appendAgentRun, getBudgetStatus, getProject, listEvidence } from "../../../../../lib/store";
import { requirePrincipal } from "../../../../../lib/auth";

const allowed = new Set<AgentName>(["validation", "product", "architecture", "learning"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id } = await context.params;
  const organizationId = auth.principal.organizationId;
  const project = await getProject(id, organizationId);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const body = await request.json().catch(() => null) as { agent?: unknown } | null;
  const agent = body?.agent as AgentName;
  if (!allowed.has(agent)) return Response.json({ error: "Unknown agent" }, { status: 400 });

  const budget = await getBudgetStatus(id, organizationId);
  if (budget.remainingTodayUsd <= 0) return Response.json({ error: "Daily AI budget exhausted", budget }, { status: 402 });
  const evidence = await listEvidence(id, organizationId, 25);
  try {
    const run = await runAgent(agent, project, { evidence, perRunBudgetUsd: Math.min(budget.perRunBudgetUsd, budget.remainingTodayUsd) });
    const updated = await appendAgentRun(id, organizationId, run);
    return Response.json({ project: updated, run, budget: await getBudgetStatus(id, organizationId) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Agent run failed", budget }, { status: 502 });
  }
}
