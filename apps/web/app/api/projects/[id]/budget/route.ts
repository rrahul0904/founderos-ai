import { getBudgetStatus, getProject, setBudget } from "../../../../../lib/store";
import { requirePrincipal } from "../../../../../lib/auth";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id } = await context.params;
  if (!await getProject(id, auth.principal.organizationId)) return Response.json({ error: "Project not found" }, { status: 404 });
  return Response.json(await getBudgetStatus(id, auth.principal.organizationId));
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePrincipal(request);
  if (!auth.principal) return auth.response;
  const { id } = await context.params;
  if (!await getProject(id, auth.principal.organizationId)) return Response.json({ error: "Project not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as { dailyBudgetUsd?: unknown; perRunBudgetUsd?: unknown } | null;
  const daily = Number(body?.dailyBudgetUsd);
  const perRun = Number(body?.perRunBudgetUsd);
  if (!Number.isFinite(daily) || daily <= 0 || daily > 1000 || !Number.isFinite(perRun) || perRun <= 0 || perRun > daily) {
    return Response.json({ error: "Budget must be positive, per-run <= daily, and daily <= $1000" }, { status: 400 });
  }
  return Response.json(await setBudget(id, auth.principal.organizationId, daily, perRun));
}
