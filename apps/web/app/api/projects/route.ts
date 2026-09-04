import { addProject, listProjects } from "../../../lib/store";

export async function GET() {
  return Response.json(listProjects());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { idea?: unknown } | null;
  const idea = typeof body?.idea === "string" ? body.idea.trim() : "";
  if (idea.length < 20 || idea.length > 5000) {
    return Response.json({ error: "Idea must be between 20 and 5000 characters." }, { status: 400 });
  }
  return Response.json(addProject(idea), { status: 201 });
}
