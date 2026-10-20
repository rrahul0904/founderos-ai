import {
  addCustomerSignal, evaluatePivot, initialFounderIntelligence, redactSensitive,
  replanFounderDay, setMoveComplete, setPivotRule, specialistArtifact, updateCompanyProfile,
  type PivotRule, type SignalKind, type SpecialistKind
} from "@founderos/core";
import { addEvidence, getProject, updateProject, writeAuditEvent } from "../../../../../lib/store";
import { requirePrincipal } from "../../../../../lib/auth";

type Payload = Record<string, unknown>;
const isObject=(value:unknown): value is Payload=>typeof value==="object"&&value!==null&&!Array.isArray(value);
const specialists=new Set<SpecialistKind>(["gtm","competitor","financial","research","fundraising","brainstorm"]);
function sameOrigin(request:Request) {
  const origin=request.headers.get("origin");
  if(!origin)return true;
  try{return new URL(origin).host===new URL(request.url).host;}catch{return false;}
}

export async function GET(request:Request,context:{params:Promise<{id:string}>}){
 const auth=await requirePrincipal(request);
 if(!auth.principal)return auth.response;
 const {id}=await context.params;
 const project=await getProject(id,auth.principal.organizationId);
 if(!project)return Response.json({error:"Project not found"},{status:404});
 const state=project.founderIntelligence??initialFounderIntelligence();
 return Response.json({state,pivot:evaluatePivot(state.rule)});
}

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
 const auth=await requirePrincipal(request);
 if(!auth.principal)return auth.response;
 if(!sameOrigin(request))return Response.json({error:"Cross-origin update refused"},{status:403});
 const {id}=await context.params;
 const org=auth.principal.organizationId;
 const project=await getProject(id,org);
 if(!project)return Response.json({error:"Project not found"},{status:404});
 const body=await request.json().catch(()=>null);
 if(!isObject(body))return Response.json({error:"JSON object required"},{status:400});
 const original=project.founderIntelligence??initialFounderIntelligence();
 if(typeof body.revision!=="number"||!Number.isInteger(body.revision)||body.revision!==original.revision)return Response.json({error:"Stale founder state; reload and retry"},{status:409});
 const action=String(body.action??"");
 try{
  if(action==="artifact"){
   if(!specialists.has(body.kind as SpecialistKind))return Response.json({error:"Unknown specialist"},{status:400});
   return Response.json({state:original,artifact:specialistArtifact(body.kind as SpecialistKind,original)});
  }
  let state=original;
  if(action==="profile"){
   if(!isObject(body.profile))return Response.json({error:"Profile object required"},{status:400});
   state=updateCompanyProfile(state,body.profile);
  } else if(action==="signal"){
   const kind=body.kind as SignalKind;
   if(!["objection","pain","positive"].includes(kind))return Response.json({error:"Unsupported signal kind"},{status:400});
   if(typeof body.quote!=="string"||body.quote.trim().length<12||body.quote.length>4000)return Response.json({error:"Quote must be 12-4000 characters"},{status:400});
   const quote=redactSensitive(body.quote.trim());
   const persona=redactSensitive(typeof body.persona==="string"?body.persona.trim().slice(0,160):"");
   const source=redactSensitive(typeof body.source==="string"?body.source.trim().slice(0,160):"");
   // Validate before writing; preserve an exact (redacted) quote as a provenance-linked evidence record.
   addCustomerSignal(state,{evidenceId:"validation",kind,quote,persona,source},"validation");
   const record=await addEvidence({projectId:id,organizationId:org,sourceType:"interview",title:`Customer ${kind}`,claim:`Interview signal: ${quote.slice(0,700)}`,excerpt:quote,confidence:.6,metadata:{kind,persona,source,origin:"founder-intelligence"}});
   state=addCustomerSignal(state,{evidenceId:record.id,kind,quote,persona,source},crypto.randomUUID());
  } else if(action==="rule"){
   if(!isObject(body.rule))return Response.json({error:"Pivot rule object required"},{status:400});
   const raw=body.rule;
   const rule:PivotRule={
    metric:typeof raw.metric==="string"?raw.metric:"",
    fallback:typeof raw.fallback==="string"?raw.fallback:"",
    threshold:typeof raw.threshold==="number"?raw.threshold:NaN,
    current:typeof raw.current==="number"?raw.current:NaN,
    deadline:typeof raw.deadline==="string"?raw.deadline:""
   };
   state=setPivotRule(state,rule);
  } else if(action==="replan")state=replanFounderDay(state);
  else if(action==="complete"){
   if(typeof body.id!=="string"||typeof body.complete!=="boolean")return Response.json({error:"Move ID and completion required"},{status:400});
   state=setMoveComplete(state,body.id,body.complete);
  }else return Response.json({error:"Unknown action"},{status:400});
  const updated=await updateProject(id,org,{founderIntelligence:state});
  if(!updated)return Response.json({error:"Project not found"},{status:404});
  await writeAuditEvent({organizationId:org,projectId:id,actorUserId:auth.principal.userId,eventName:`founder_intelligence.${action}`,properties:{revision:state.revision,signal_count:state.signals.length}});
  return Response.json({state,pivot:evaluatePivot(state.rule)});
 }catch(error){
  if(error instanceof RangeError)return Response.json({error:"Invalid numeric or date value"},{status:400});
  if(error instanceof Error && /Invalid|Unsupported|required|found|characters|quote/i.test(error.message))return Response.json({error:error.message},{status:400});
  return Response.json({error:"Unable to save founder intelligence"},{status:500});
 }
}
