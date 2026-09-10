import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "../../../lib/auth";
import { getBudgetStatus, getProject, listEvidence, listJobs } from "../../../lib/store";
import { Workspace } from "../../../components/workspace";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await getPrincipal();
  if (!principal) redirect("/login");
  const { id } = await params;
  const project = await getProject(id, principal.organizationId);
  if (!project) notFound();
  const [evidence, jobs, budget] = await Promise.all([
    listEvidence(id, principal.organizationId, 50),
    listJobs(id, principal.organizationId),
    getBudgetStatus(id, principal.organizationId)
  ]);
  return (
    <main className="shell">
      <header className="topbar">
        <a href="/" className="brand"><div className="logo">F</div> FounderOS</a>
        <div className="pill">Idea → evidence → product → learning</div>
      </header>
      <Workspace initial={project} initialEvidence={evidence} initialJobs={jobs} initialBudget={budget} />
    </main>
  );
}
