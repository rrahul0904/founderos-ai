import { notFound } from "next/navigation";
import { getProject } from "../../../lib/store";
import { Workspace } from "../../../components/workspace";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  return (
    <main className="shell">
      <header className="topbar">
        <a href="/" className="brand"><div className="logo">F</div> FounderOS</a>
        <div className="pill">Idea → evidence → product → learning</div>
      </header>
      <Workspace initial={project} />
    </main>
  );
}
