import { notFound, redirect } from "next/navigation";
import { initialFounderIntelligence } from "@founderos/core";
import { getPrincipal } from "../../../../lib/auth";
import { getProject } from "../../../../lib/store";
import { FounderIntelligence } from "../../../../components/founder-intelligence";

export const dynamic = "force-dynamic";
export default async function FounderIntelligencePage({params}:{params:Promise<{id:string}>}){
  const principal=await getPrincipal();
  if(!principal)redirect("/login");
  const {id}=await params;
  const project=await getProject(id,principal.organizationId);
  if(!project)notFound();
  return <main className="shell">
   <header className="topbar"><a className="brand" href="/"><div className="logo">F</div>FounderOS</a><a className="pill" href={`/projects/${id}`}>← Project brain</a></header>
   <FounderIntelligence projectId={id} initial={project.founderIntelligence??initialFounderIntelligence()}/>
  </main>;
}
