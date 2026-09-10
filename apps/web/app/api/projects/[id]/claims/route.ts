import { addClaim, getProject, listClaims } from "../../../../../lib/store";
import { requirePrincipal } from "../../../../../lib/auth";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth=await requirePrincipal(request); if(!auth.principal)return auth.response; const {id}=await context.params;
  if(!await getProject(id,auth.principal.organizationId))return Response.json({error:"Project not found"},{status:404});
  return Response.json(await listClaims(id,auth.principal.organizationId));
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth=await requirePrincipal(request); if(!auth.principal)return auth.response; const {id}=await context.params;
  if(!await getProject(id,auth.principal.organizationId))return Response.json({error:"Project not found"},{status:404});
  const body=await request.json().catch(()=>null) as {statement?:unknown;evidenceIds?:unknown;confidence?:unknown}|null;
  const statement=typeof body?.statement==="string"?body.statement.trim():""; if(statement.length<5||statement.length>4000)return Response.json({error:"Statement must be 5-4000 characters"},{status:400});
  const evidenceIds=Array.isArray(body?.evidenceIds)?body.evidenceIds.filter((x):x is string=>typeof x==="string").slice(0,50):[];
  const confidence=typeof body?.confidence==="number"?body.confidence:0.5;
  return Response.json(await addClaim(id,auth.principal.organizationId,statement,evidenceIds,confidence),{status:201});
}
