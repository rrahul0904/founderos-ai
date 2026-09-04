import { createProject, readinessForStage, type FounderProject, type LifecycleStage } from "@founderos/core";

type Store = Map<string, FounderProject>;

declare global {
  // eslint-disable-next-line no-var
  var founderOSProjects: Store | undefined;
}

const projects = globalThis.founderOSProjects ?? new Map<string, FounderProject>();
if (process.env.NODE_ENV !== "production") globalThis.founderOSProjects = projects;

export function listProjects() {
  return Array.from(projects.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(id: string) {
  return projects.get(id) ?? null;
}

export function addProject(idea: string) {
  const project = createProject(idea);
  projects.set(project.id, project);
  return project;
}

export function updateProject(id: string, patch: Partial<FounderProject>) {
  const current = projects.get(id);
  if (!current) return null;
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
  projects.set(id, updated);
  return updated;
}

export function appendAgentRun(id: string, agent: FounderProject["runs"][number]) {
  const current = projects.get(id);
  if (!current) return null;
  return updateProject(id, {
    runs: [agent, ...current.runs],
    stage: agent.stage as LifecycleStage,
    readiness: readinessForStage(agent.stage as LifecycleStage),
    latestOutput: agent.output
  });
}
