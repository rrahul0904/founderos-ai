export type LifecycleStage = "idea" | "evidence" | "decision" | "spec" | "architecture" | "build" | "deploy" | "learn";

export interface AgentRunRecord {
  id: string;
  agent: "validation" | "product" | "architecture" | "learning";
  stage: LifecycleStage;
  provider: string;
  output: string;
  createdAt: string;
}

export interface FounderProject {
  id: string;
  name: string;
  idea: string;
  stage: LifecycleStage;
  readiness: number;
  assumptions: string[];
  decisions: string[];
  latestOutput: string;
  runs: AgentRunRecord[];
  createdAt: string;
  updatedAt: string;
}

export function deriveName(idea: string): string {
  const clean = idea.replace(/[^a-zA-Z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  const words = clean.split(" ").filter(Boolean).slice(0, 5);
  return words.length ? words.join(" ") : "Untitled product";
}

export function createProject(idea: string): FounderProject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: deriveName(idea),
    idea,
    stage: "idea",
    readiness: 18,
    assumptions: ["A reachable user has this problem", "The pain is strong enough to change behavior", "A focused MVP can test the thesis"],
    decisions: [],
    latestOutput: "",
    runs: [],
    createdAt: now,
    updatedAt: now
  };
}

export function readinessForStage(stage: LifecycleStage): number {
  const scores: Record<LifecycleStage, number> = {
    idea: 18, evidence: 34, decision: 48, spec: 61, architecture: 72, build: 82, deploy: 90, learn: 96
  };
  return scores[stage];
}
