import { notFound, redirect } from "next/navigation";
import { BuildExecution } from "../../../../components/build-execution";
import { getPrincipal } from "../../../../lib/auth";
import { getProject } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await getPrincipal();
  if (!principal) redirect("/login");
  const { id } = await params;
  const project = await getProject(id, principal.organizationId);
  if (!project) notFound();
  return <main className="shell">
    <header className="topbar">
      <a href={`/projects/${id}`} className="brand"><div className="logo">F</div> FounderOS</a>
      <div className="pill">Build execution · approval gated</div>
    </header>
    <BuildExecution projectId={project.id} projectName={project.name} initialPlans={project.buildPlans ?? []} />
  </main>;
}
