import { IdeaForm } from "../components/idea-form";

const phases = [
  ["01 Evidence", "Find real signals before committing."],
  ["02 Decide", "Turn uncertainty into explicit decisions."],
  ["03 Specify", "Create a focused MVP and acceptance criteria."],
  ["04 Architect", "Choose a scalable, cost-aware technical path."],
  ["05 Build", "Generate and operate implementation work."],
  ["06 Learn", "Use telemetry and users to choose what comes next."]
];

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><div className="logo">F</div> FounderOS</div>
        <div className="pill">Evidence-first product intelligence</div>
      </header>
      <section className="container">
        <div className="hero">
          <div className="eyebrow">One product brain. Full lifecycle.</div>
          <h1>Build the right product, not just more code.</h1>
          <p>
            FounderOS keeps research, assumptions, product decisions, architecture, implementation,
            deployment signals and customer learning in one durable context.
          </p>
          <IdeaForm />
        </div>
        <div className="flow">
          {phases.map(([title, copy]) => (
            <div className="flow-card" key={title}>
              <b>{title}</b><span>{copy}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
