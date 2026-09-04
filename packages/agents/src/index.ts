import { readinessForStage, type AgentRunRecord, type FounderProject, type LifecycleStage } from "@founderos/core";

export type AgentName = AgentRunRecord["agent"];

interface AgentDefinition {
  stage: LifecycleStage;
  objective: string;
}

const definitions: Record<AgentName, AgentDefinition> = {
  validation: { stage: "evidence", objective: "Test the problem, users, alternatives, risks, and evidence required before building." },
  product: { stage: "spec", objective: "Convert evidence into a narrow ICP, MVP scope, outcomes, and acceptance criteria." },
  architecture: { stage: "architecture", objective: "Design the smallest scalable architecture with explicit boundaries, cost, security, and operations." },
  learning: { stage: "learn", objective: "Define telemetry, experiments, feedback loops, and the next evidence-backed iteration." }
};

function localOutput(agent: AgentName, project: FounderProject): string {
  const idea = project.idea;
  const outputs: Record<AgentName, string> = {
    validation: `VALIDATION BRIEF\n\nThesis\n${idea}\n\nWhat must be true\n1. A specific user repeatedly experiences this problem.\n2. Existing workflows create measurable friction: time, money, risk, or lost context.\n3. The user will trust one system to preserve product context across phases.\n\nEvidence plan\n• Interview 10 target users and collect exact current workflows.\n• Analyze 5 direct/adjacent competitors by workflow, pricing, complaints, and switching barriers.\n• Gather at least 25 problem statements from public communities or customer calls.\n• Separate evidence from founder assumptions in the project brain.\n\nKill criteria\n• Fewer than 4/10 interviewees report the problem at least weekly.\n• No credible path to a 10× improvement over tool-switching.\n• The MVP requires broad autonomous coding before the evidence loop itself proves useful.\n\nInitial opportunity score: 68/100 — promising thesis, evidence still required.`,
    product: `MVP PRODUCT SPEC\n\nIdeal customer\nSolo technical founder or small product team moving between research, planning, coding, deployment and analytics.\n\nCore job\n"Keep the reasoning and evidence behind my product intact while I move from idea to a working, learning product."\n\nMVP\n1. Idea intake and structured project memory.\n2. Evidence workspace with sources, claims and confidence.\n3. Decision log that records why scope changes.\n4. Product agent that produces an MVP spec from approved evidence.\n5. Architecture agent that produces implementation slices and risks.\n6. Post-deploy learning plan and experiment backlog.\n\nExplicitly out of scope\nFull cloud IDE, autonomous production deploys, visual page builder, arbitrary browser agents, and multi-user enterprise governance.\n\nSuccess metric\nA founder can move from raw idea to an evidence-backed MVP plan in <30 minutes while preserving every important assumption and decision.`,
    architecture: `REFERENCE ARCHITECTURE\n\nExperience\nNext.js App Router workspace with server-first reads and narrow client interaction boundaries.\n\nControl plane\nProject service, evidence service, decision service, agent orchestrator and job API.\n\nData\nPostgreSQL is the system of record. Projects, claims, evidence, decisions, runs and durable jobs are normalized; large artifacts move to object storage later.\n\nAI runtime\nProvider-neutral agent contract. Local deterministic provider is the zero-cost default. Hosted models are optional and must emit structured run metadata for cost, latency and provenance.\n\nWorkers\nDurable PostgreSQL-backed jobs with leases, retries and idempotency keys. Browser research is isolated in workers rather than the web request path.\n\nObservability\nEvery agent run emits run_id, project_id, provider, model, latency, tokens/cost when known, and outcome.\n\nDeployment\nWeb can run on Vercel or any Node container. Worker and PostgreSQL run on containers/Kubernetes/cloud services. No platform-specific business logic.\n\nSecurity\nServer-only provider keys, project-level authorization boundary, source allow/deny policy, prompt-injection isolation for external content, and auditable agent actions.`,
    learning: `PRODUCT LEARNING LOOP\n\nInstrument\n• idea_created → evidence_added → decision_approved → spec_generated → build_started → deployment_created\n• activation: first evidence-backed decision within one session\n• retention: project revisited with new evidence or telemetry within 7 days\n\nFirst experiments\n1. Evidence-first onboarding vs immediate build CTA.\n2. Automatic competitor research vs guided research checklist.\n3. Decision confidence scoring vs plain notes.\n\nQualitative loop\nAsk after each major phase: "What did FounderOS know that your previous tool did not?" Store answers as product evidence.\n\nNext iteration rule\nDo not add a broad coding IDE until users repeatedly ask FounderOS to execute plans that they already trust. Earn the build surface after the product brain proves its value.`
  };
  return outputs[agent];
}

async function openAIOutput(agent: AgentName, project: FounderProject): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || process.env.AI_PROVIDER !== "openai") return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: [
        { role: "system", content: [{ type: "input_text", text: `You are the FounderOS ${agent} agent. ${definitions[agent].objective} Be evidence-first. Clearly label assumptions and never fabricate research.` }] },
        { role: "user", content: [{ type: "input_text", text: `Project idea: ${project.idea}\nCurrent stage: ${project.stage}\nKnown assumptions: ${project.assumptions.join("; ")}` }] }
      ]
    })
  });
  if (!response.ok) return null;
  const data = await response.json() as { output_text?: string };
  return data.output_text || null;
}

export async function runAgent(agent: AgentName, project: FounderProject): Promise<AgentRunRecord> {
  const hosted = await openAIOutput(agent, project);
  const stage = definitions[agent].stage;
  return {
    id: crypto.randomUUID(),
    agent,
    stage,
    provider: hosted ? "openai" : "mock",
    output: hosted ?? localOutput(agent, project),
    createdAt: new Date().toISOString()
  };
}

export function recommendedReadiness(agent: AgentName) {
  return readinessForStage(definitions[agent].stage);
}
