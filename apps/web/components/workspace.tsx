"use client";

import { useState } from "react";
import type { FounderProject } from "@founderos/core";
import type { AgentName } from "@founderos/agents";

const agents: Array<[AgentName, string, string]> = [
  ["validation", "Validation agent", "Evidence, competitors, risks, score"],
  ["product", "Product agent", "ICP, MVP, outcomes, acceptance criteria"],
  ["architecture", "Architecture agent", "System design, stack, boundaries, cost"],
  ["learning", "Learning agent", "Telemetry, experiments, next iteration"]
];

const stages = ["idea", "evidence", "decision", "spec", "architecture", "build", "deploy", "learn"];

export function Workspace({ initial }: { initial: FounderProject }) {
  const [project, setProject] = useState(initial);
  const [busy, setBusy] = useState<AgentName | null>(null);

  async function run(agent: AgentName) {
    setBusy(agent);
    try {
      const response = await fetch(`/api/projects/${project.id}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent })
      });
      if (!response.ok) throw new Error("Agent run failed");
      setProject(await response.json());
    } finally {
      setBusy(null);
    }
  }

  const currentIndex = stages.indexOf(project.stage);
  return (
    <div className="workspace">
      <aside className="panel">
        <div className="panel-head"><b>Lifecycle</b><span className="small muted">v0.1</span></div>
        <ul className="stage-list">
          {stages.map((stage, index) => {
            const status = index < currentIndex ? "done" : index === currentIndex ? "active" : "pending";
            return <li className={`stage ${status}`} key={stage}>{stage[0].toUpperCase() + stage.slice(1)}</li>;
          })}
        </ul>
      </aside>

      <section className="panel">
        <div className="panel-head">
          <div>
            <div className="small muted">PROJECT BRAIN</div>
            <h2 className="project-title">{project.name}</h2>
          </div>
          <span className="pill">{project.stage}</span>
        </div>
        <div className="panel-body">
          <div className="grid2">
            <div className="card">
              <h3>Original idea</h3>
              <p>{project.idea}</p>
            </div>
            <div className="card">
              <h3>Evidence readiness</h3>
              <div className="score">{project.readiness}<small>/100</small></div>
              <p>Readiness rises only when assumptions become evidence-backed decisions.</p>
            </div>
          </div>

          <div style={{height:14}} />
          <div className="card">
            <h3>Latest intelligence</h3>
            <div className="output">{project.latestOutput || "Run an agent to turn this idea into structured product intelligence."}</div>
          </div>

          <div style={{height:14}} />
          <div className="grid2">
            <div className="card">
              <h3>Known assumptions</h3>
              <div className="tags">{project.assumptions.map((item) => <span className="tag" key={item}>{item}</span>)}</div>
            </div>
            <div className="card">
              <h3>Decision log</h3>
              <p>{project.decisions.length ? project.decisions.join(" · ") : "No irreversible decisions yet. Evidence comes first."}</p>
            </div>
          </div>
        </div>
      </section>

      <aside className="panel">
        <div className="panel-head"><b>Agents</b><span className="small muted">shared memory</span></div>
        <div className="panel-body">
          <div className="agent-actions">
            {agents.map(([id, title, copy]) => (
              <button className="agent-btn" key={id} onClick={() => run(id)} disabled={busy !== null}>
                <b>{busy === id ? "Running…" : title}</b><span>{copy}</span>
              </button>
            ))}
          </div>
          <div style={{height:22}} />
          <div className="small muted" style={{marginBottom:10}}>ACTIVITY</div>
          <div className="timeline">
            {project.runs.length === 0 ? <div className="muted small">No agent runs yet.</div> : project.runs.slice(0, 8).map((run) => (
              <div className="event" key={run.id}>
                <b>{run.agent} → {run.stage}</b>
                <p>{new Date(run.createdAt).toLocaleString()} · {run.provider}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
