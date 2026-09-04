import { runAgent, type AgentName } from "@founderos/agents";
import { appendAgentRun, getProject } from "../../../../../lib/store";

const allowed = new Set<AgentName>(["validation", "product", "architecture", "learning"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = getProject(id);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const body = await request.json().catch(() => null) as { agent?: unknown } | null;
  const agent = body?.agent as AgentName;
  if (!allowed.has(agent)) return Response.json({ error: "Unknown agent" }, { status: 400 });

  const run = await runAgent(agent, project);
  const updated = appendAgentRun(id, run);
  return Response.json(updated);
}
