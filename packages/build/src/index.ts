import type { BuildPlanRecord, BuildTaskRecord, FounderProject } from "@founderos/core";

export interface BuildPlanInput {
  repository: string;
  objective?: string;
  baseBranch?: string;
}

function compact(value: string, max = 1200) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "project";
}

export function normalizeRepository(repository: string) {
  const value = repository.trim().replace(/^https:\/\/github\.com\//i, "").replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error("Repository must be in owner/name form or a github.com repository URL");
  }
  return value;
}

function latestRun(project: FounderProject, agent: FounderProject["runs"][number]["agent"]) {
  return project.runs.find((run) => run.agent === agent)?.output ?? "";
}

function task(
  order: number,
  title: string,
  description: string,
  acceptanceCriteria: string[],
  risk: BuildTaskRecord["risk"]
): BuildTaskRecord {
  return {
    id: crypto.randomUUID(),
    order,
    title,
    description,
    acceptanceCriteria,
    risk,
    status: "planned"
  };
}

export function generateBuildPlan(project: FounderProject, input: BuildPlanInput): BuildPlanRecord {
  const repository = normalizeRepository(input.repository);
  const objective = compact(input.objective?.trim() || project.idea, 2000);
  const baseBranch = compact(input.baseBranch?.trim() || "main", 120);
  if (!/^[A-Za-z0-9._\/-]+$/.test(baseBranch)) throw new Error("Base branch contains unsupported characters");

  const productContext = compact(latestRun(project, "product") || project.latestOutput || project.idea);
  const architectureContext = compact(latestRun(project, "architecture") || project.latestOutput || project.idea);
  const suffix = crypto.randomUUID().slice(0, 8);
  const branchName = `founderos/${slug(project.name)}-${suffix}`;

  const tasks = [
    task(
      1,
      "Lock the implementation contract",
      `Translate the approved objective into an executable repository-scoped contract. Product context: ${productContext}`,
      [
        "Document the exact in-scope behavior and explicit non-goals",
        "Identify changed surfaces, dependencies, migrations, and external configuration",
        "Define rollback and failure behavior before implementation begins"
      ],
      "low"
    ),
    task(
      2,
      "Implement domain and persistence changes",
      `Implement the smallest durable domain/data changes required by the objective. Architecture context: ${architectureContext}`,
      [
        "Domain types and persistence changes are backward compatible or migrated explicitly",
        "Tenant/project boundaries remain enforced",
        "New state transitions are deterministic and covered by tests"
      ],
      "medium"
    ),
    task(
      3,
      "Implement service and API behavior",
      `Add or update server-side behavior for: ${objective}`,
      [
        "Inputs are validated and authorization is enforced server-side",
        "Errors are explicit and safe to retry where appropriate",
        "Privileged actions emit auditable state or events"
      ],
      "medium"
    ),
    task(
      4,
      "Complete the user-facing workflow",
      `Expose the implementation through the narrowest usable product flow for ${project.name}.`,
      [
        "A user can complete the happy path without hidden/manual database steps",
        "Loading, empty, error, blocked, and success states are represented",
        "The UI does not claim capabilities that the backend cannot perform"
      ],
      "medium"
    ),
    task(
      5,
      "Add verification and release evidence",
      "Add executable evidence for the changed behavior before release.",
      [
        "Typecheck and automated tests cover the critical path",
        "A deterministic verification command exists for the slice",
        "Release notes distinguish repository-complete work from external configuration blockers"
      ],
      "low"
    ),
    task(
      6,
      "Prepare guarded delivery",
      `Prepare branch and review artifacts for ${repository} without bypassing human approval gates.`,
      [
        "Implementation occurs on the FounderOS-created branch, never directly on the base branch",
        "Any destructive or production-affecting operation remains approval-gated",
        "The final pull request links implementation evidence and unresolved external blockers"
      ],
      "high"
    )
  ];

  return {
    id: crypto.randomUUID(),
    projectId: project.id,
    repository,
    baseBranch,
    branchName,
    objective,
    status: "draft",
    tasks,
    createdAt: new Date().toISOString(),
    lastError: null
  };
}

export function approveBuildPlan(plan: BuildPlanRecord, actorUserId: string): BuildPlanRecord {
  if (plan.status !== "draft" && plan.status !== "blocked") {
    throw new Error(`Build plan cannot be approved from status ${plan.status}`);
  }
  return {
    ...plan,
    status: "approved",
    approvedAt: new Date().toISOString(),
    approvedBy: actorUserId,
    lastError: null
  };
}

export function replaceBuildPlan(project: FounderProject, next: BuildPlanRecord): FounderProject["buildPlans"] {
  return [next, ...(project.buildPlans ?? []).filter((plan) => plan.id !== next.id)].slice(0, 25);
}

export function renderTaskIssueBody(plan: BuildPlanRecord, task: BuildTaskRecord) {
  return [
    `## FounderOS build plan`,
    ``,
    `**Objective:** ${plan.objective}`,
    `**Plan:** \`${plan.id}\``,
    `**Target branch:** \`${plan.branchName}\``,
    `**Risk:** ${task.risk}`,
    ``,
    `## Work`,
    task.description,
    ``,
    `## Acceptance criteria`,
    ...task.acceptanceCriteria.map((item) => `- [ ] ${item}`),
    ``,
    `## Guardrails`,
    `- Do not commit directly to \`${plan.baseBranch}\`.`,
    `- Keep secrets out of source control and logs.`,
    `- Do not weaken authorization, tenant isolation, audit, or test gates to make the task pass.`,
    `- Report external credentials/infrastructure as blockers instead of fabricating success.`,
    ``,
    `_Generated by FounderOS from an approved build plan._`
  ].join("\n");
}

export function renderWorkOrder(plan: BuildPlanRecord) {
  const lines = [
    `# FounderOS work order`,
    ``,
    `Repository: ${plan.repository}`,
    `Base branch: ${plan.baseBranch}`,
    `Working branch: ${plan.branchName}`,
    `Objective: ${plan.objective}`,
    `Status: ${plan.status}`,
    ``
  ];
  for (const item of [...plan.tasks].sort((a, b) => a.order - b.order)) {
    lines.push(`## ${item.order}. ${item.title}`);
    lines.push("");
    lines.push(item.description);
    lines.push("");
    lines.push(`Risk: ${item.risk}`);
    lines.push("");
    for (const criterion of item.acceptanceCriteria) lines.push(`- [ ] ${criterion}`);
    if (item.githubIssue) lines.push(`- GitHub issue: ${item.githubIssue.url}`);
    lines.push("");
  }
  return lines.join("\n");
}
