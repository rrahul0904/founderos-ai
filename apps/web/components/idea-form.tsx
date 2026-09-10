"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function IdeaForm() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (idea.trim().length < 20) { setError("Give FounderOS a little more context — at least 20 characters."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/projects", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({idea}) });
      if (response.status === 401) { router.push("/login"); return; }
      if (!response.ok) throw new Error("Could not create project");
      const project = await response.json(); router.push(`/projects/${project.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create project"); }
    finally { setBusy(false); }
  }
  return <><div className="idea-form"><textarea aria-label="Product idea" value={idea} onChange={(e: { target: { value: string } })=>setIdea(e.target.value)} placeholder="Describe the product, user, and problem..."/><button className="primary" onClick={submit} disabled={busy}>{busy?"Creating…":"Start with evidence →"}</button></div>{error?<div className="error small">{error}</div>:null}</>;
}
