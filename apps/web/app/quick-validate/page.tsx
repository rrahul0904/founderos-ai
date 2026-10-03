import Link from "next/link";
import { QuickValidator } from "../../components/quick-validator";

export default function QuickValidatePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/"><div className="logo">F</div> FounderOS</Link>
        <div className="pill">Quick Validation</div>
      </header>
      <section className="container">
        <div className="hero">
          <div className="eyebrow">Fast first pass. Evidence comes next.</div>
          <h1>Pressure-test the idea before you burn a weekend.</h1>
          <p>Get a skeptical first read, a likely buyer hypothesis, a cheap seven-day test, pass/fail criteria, risks, search prompts and live best-effort .com checks — without creating a project.</p>
          <QuickValidator />
          <Link href="/" style={{display:"inline-flex",marginTop:24,color:"var(--accent)",fontWeight:700}}>← Back to full FounderOS</Link>
        </div>
      </section>
    </main>
  );
}
