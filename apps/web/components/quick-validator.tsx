"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuickValidationResult } from "@founderos/agents";
import styles from "./quick-validator.module.css";

const EXAMPLE = "A scheduling assistant for mobile dog groomers who waste time routing appointments across town and lose bookings when customers wait too long for a reply.";

export function QuickValidator() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState<QuickValidationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState("");

  async function validate(nextIdea = idea) {
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/quick-validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idea: nextIdea }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not run the quick check.");
      setResult(payload as QuickValidationResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not run the quick check.");
    } finally { setBusy(false); }
  }

  async function promote() {
    setPromoting(true); setError("");
    try {
      const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idea }) });
      if (response.status === 401) { router.push("/login"); return; }
      if (!response.ok) throw new Error("Could not create the FounderOS project.");
      const project = await response.json();
      router.push(`/projects/${project.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the FounderOS project.");
    } finally { setPromoting(false); }
  }

  function useExample() { setIdea(EXAMPLE); void validate(EXAMPLE); }

  return <div className={styles.wrap}>
    <div className={styles.form}>
      <textarea aria-label="Side project idea" value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Example: A tool for independent plumbers who lose leads because quote follow-up is manual and slow." />
      <div className={styles.actions}>
        <button className={styles.primary} onClick={() => void validate()} disabled={busy}>{busy ? "Pressure-testing…" : "Run quick check"}</button>
        <button className={styles.secondary} onClick={useExample} disabled={busy}>Try example</button>
      </div>
    </div>
    <div className={styles.note}>Quick Validation does not create or save a FounderOS project. Hosted AI is opt-in on the server; otherwise the check uses the deterministic local engine.</div>
    {error ? <div className={styles.error} role="alert">{error}</div> : null}

    {result ? <section className={styles.result} aria-live="polite">
      <div className={styles.verdict}>
        <div className={styles.verdictRow}><span className={styles.badge}>{result.verdictLabel}</span><span className={styles.provider}>{result.provider === "openai" ? "Hosted AI + guardrails" : "Deterministic local check"}</span></div>
        <h2>{result.rationale}</h2>
        <p>{result.sharperPositioning}</p>
      </div>

      <div className={styles.grid}>
        <article className={styles.card}><h3>Who may pay</h3><p>{result.likelyPayer}</p></article>
        <article className={styles.card}><h3>Problem hypothesis</h3><p>{result.problemHypothesis}</p></article>
        <article className={`${styles.card} ${styles.wide}`}><h3>Cheapest 7-day test</h3><p>{result.firstTest}</p></article>
        <article className={`${styles.card} ${styles.wide}`}><h3>Pass / fail signal</h3><p>{result.passThreshold}</p></article>
        <article className={styles.card}><h3>Current alternatives</h3><ul>{result.currentAlternatives.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className={styles.card}><h3>What could kill it</h3><ul>{result.risks.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className={`${styles.card} ${styles.wide}`}><h3>Search next</h3><div className={styles.searches}>{result.searchQueries.map((item) => <span className={styles.chip} key={item}>{item}</span>)}</div></article>
        <article className={`${styles.card} ${styles.wide}`}><h3>Name candidates</h3><div className={styles.names}>{result.nameIdeas.map((item) => <div className={styles.name} key={item.domain}><b>{item.name}</b><span>{item.domain}</span><span className={item.status === "available" ? styles.available : item.status === "registered" ? styles.registered : styles.unknown}>{item.status === "available" ? "No .com registry record found — verify before buying" : item.status === "registered" ? "Registered" : item.status === "unknown" ? "Registry check unavailable" : "Not checked"}</span></div>)}</div></article>
      </div>

      <div className={styles.evidence}><b>{result.evidenceStatus.label}.</b> {result.evidenceStatus.detail}</div>
      <div className={styles.promote}><p><b>Ready for the real validation pass?</b><br/>Create a durable FounderOS project only when you want research, source provenance, competitors, contradictory evidence, product decisions and implementation planning to persist.</p><button className={styles.primary} onClick={() => void promote()} disabled={promoting}>{promoting ? "Creating…" : "Turn into a FounderOS project →"}</button></div>
    </section> : null}
  </div>;
}
