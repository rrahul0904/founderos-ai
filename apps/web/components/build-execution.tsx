"use client";

import { useState } from "react";
import type { BuildExecutionRecord, BuildPlanRecord } from "@founderos/core";

export function BuildExecution({ projectId, projectName, initialPlans }: { projectId: string; projectName: string; initialPlans: BuildPlanRecord[] }) {
  const [repository, setRepository] = useState("");
  const [objective, setObjective] = useState("");
  const [plans, setPlans] = useState(initialPlans);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function call(path: string, options: RequestInit = {}) {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({})) as { error?: unknown } & Partial<BuildPlanRecord>;
    if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : `Request failed (${response.status})`);
    return data as BuildPlanRecord;
  }

  function replace(plan: BuildPlanRecord) {
    setPlans((current) => [plan, ...current.filter((item) => item.id !== plan.id)]);
  }

  async function createPlan() {
    setBusy("create"); setMessage("");
    try {
      const plan = await call(`/api/projects/${projectId}/build`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ repository, objective: objective || undefined }) });
      replace(plan); setMessage("Draft build plan created. Review it before approval.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create plan"); }
    finally { setBusy(null); }
  }

  async function approve(planId: string) {
    setBusy(planId); setMessage("");
    try { replace(await call(`/api/projects/${projectId}/build/${planId}/approve`, { method: "POST" })); setMessage("Plan approved. GitHub publication is now unlocked."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to approve plan"); }
    finally { setBusy(null); }
  }

  async function publish(planId: string) {
    setBusy(planId); setMessage("");
    try { replace(await call(`/api/projects/${projectId}/build/${planId}/publish`, { method: "POST" })); setMessage("Branch and implementation issues published to GitHub."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to publish plan"); }
    finally { setBusy(null); }
  }

  async function execute(planId: string) {
    setBusy(planId); setMessage("");
    try {
      const response = await fetch(`/api/projects/${projectId}/build/${planId}/execute`, { method: "POST" });
      const data = await response.json() as { error?: string; plan?: BuildPlanRecord; execution?: BuildExecutionRecord };
      if (!response.ok || !data.plan) throw new Error(data.error || "Unable to queue sandbox execution");
      replace(data.plan); setMessage(`Sandbox execution ${data.execution?.status ?? "queued"}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to queue sandbox execution"); }
    finally { setBusy(null); }
  }

  async function refreshExecution(planId: string) {
    setBusy(planId); setMessage("");
    try {
      const response = await fetch(`/api/projects/${projectId}/build/${planId}/execute`);
      const data = await response.json() as { error?: string; plan?: BuildPlanRecord; execution?: BuildExecutionRecord | null };
      if (!response.ok || !data.plan) throw new Error(data.error || "Unable to refresh execution");
      replace(data.plan);
      setMessage(data.execution ? `Execution status: ${data.execution.status}${data.execution.lastError ? ` — ${data.execution.lastError}` : ""}` : "No durable execution found yet.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to refresh execution"); }
    finally { setBusy(null); }
  }

  async function openPullRequest(planId: string) {
    setBusy(planId); setMessage("");
    try { replace(await call(`/api/projects/${projectId}/build/${planId}/pull-request`, { method: "POST" })); setMessage("Draft pull request opened or reused."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to open pull request"); }
    finally { setBusy(null); }
  }

  async function copyWorkOrder(planId: string) {
    setBusy(planId); setMessage("");
    try {
      const response = await fetch(`/api/projects/${projectId}/build/${planId}/work-order`);
      if (!response.ok) throw new Error("Unable to generate work order");
      await navigator.clipboard.writeText(await response.text()); setMessage("Work order copied to clipboard.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to copy work order"); }
    finally { setBusy(null); }
  }

  return <div className="container" style={{ paddingTop: 28 }}>
    <div className="card">
      <div className="small muted">PHASE 2 · BUILD EXECUTION</div><h2>{projectName}</h2>
      <p>Convert an evidence-backed project into an approval-gated GitHub delivery plan. FounderOS creates a dedicated branch and implementation issues; sandbox execution is opt-in and only pushes code after isolated verification passes.</p>
      <div className="grid2">
        <div><div className="small muted">TARGET REPOSITORY</div><input value={repository} onChange={(event) => setRepository(event.target.value)} placeholder="owner/repository" /></div>
        <div><div className="small muted">OBJECTIVE (OPTIONAL)</div><input value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Use the project objective by default" /></div>
      </div>
      <button className="agent-btn" disabled={busy !== null || !repository.trim()} onClick={createPlan}><b>{busy === "create" ? "Creating…" : "Create draft build plan"}</b><span>Generate scoped tasks, acceptance criteria, risk, branch name, and release evidence.</span></button>
      {message ? <div className="small" style={{ marginTop: 12 }}>{message}</div> : null}
    </div>
    <div style={{ height: 14 }} />
    {plans.length === 0 ? <div className="card"><h3>No build plans yet</h3><p>Create one when product scope and architecture are ready to hand off to implementation.</p></div> : null}
    {plans.map((plan) => <div className="card" key={plan.id} style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><div><div className="small muted">{plan.repository} · {plan.baseBranch} → {plan.branchName}</div><h3>{plan.objective}</h3></div><span className="pill">{plan.status}</span></div>
      {plan.lastError ? <div className="error small">Last blocker: {plan.lastError}</div> : null}
      {plan.verification ? <p>Verification: <b>{plan.verification.status}</b> · {plan.verification.summary}</p> : null}
      {plan.executionCommit ? <p>Verified commit: <code>{plan.executionCommit}</code></p> : null}
      {plan.releaseEvidence ? <p>Release evidence SHA-256: <code>{plan.releaseEvidence.digestSha256}</code></p> : null}
      {plan.pullRequest ? <p><a href={plan.pullRequest.url} target="_blank" rel="noreferrer">Draft pull request #{plan.pullRequest.number}</a></p> : null}
      <div className="timeline" style={{ marginTop: 14 }}>{[...plan.tasks].sort((a, b) => a.order - b.order).map((task) => <div className="event" key={task.id}><b>{task.order}. {task.title} · {task.risk}</b><p>{task.description}</p>{task.githubIssue ? <p><a href={task.githubIssue.url} target="_blank" rel="noreferrer">GitHub issue #{task.githubIssue.number}</a></p> : null}</div>)}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        {plan.status === "draft" || (plan.status === "blocked" && !plan.approvedAt) ? <button className="agent-btn" disabled={busy !== null} onClick={() => approve(plan.id)}><b>Approve plan</b><span>Human gate before external GitHub writes.</span></button> : null}
        {plan.approvedAt && ["approved", "publishing", "blocked"].includes(plan.status) ? <button className="agent-btn" disabled={busy !== null} onClick={() => publish(plan.id)}><b>{busy === plan.id ? "Publishing…" : "Publish to GitHub"}</b><span>Create/resume branch and implementation issues idempotently.</span></button> : null}
        {["published", "pr_open"].includes(plan.status) && !plan.executionCommit ? <button className="agent-btn" disabled={busy !== null} onClick={() => execute(plan.id)}><b>{busy === plan.id ? "Queuing…" : plan.executionId ? "Retry sandbox build" : "Run sandbox build"}</b><span>Generate code, verify it in isolation, then push only if green.</span></button> : null}
        {plan.executionId && (!plan.executionCommit || !plan.releaseEvidence) ? <button className="agent-btn" disabled={busy !== null} onClick={() => refreshExecution(plan.id)}><b>Refresh execution</b><span>Read worker status and persist release evidence after success.</span></button> : null}
        {plan.status === "published" && plan.executionCommit && !plan.pullRequest ? <button className="agent-btn" disabled={busy !== null} onClick={() => openPullRequest(plan.id)}><b>{busy === plan.id ? "Opening PR…" : "Open draft PR"}</b><span>Create/reuse the review boundary after verified code exists.</span></button> : null}
        <button className="agent-btn" disabled={busy !== null} onClick={() => copyWorkOrder(plan.id)}><b>Copy work order</b><span>Portable implementation context for a coding agent or operator.</span></button>
      </div>
    </div>)}
  </div>;
}
