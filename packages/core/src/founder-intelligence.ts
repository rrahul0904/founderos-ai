/**
 * Clean-room founder intelligence primitives.
 * Inputs are founder-supplied; no autonomous outreach or fabricated evidence.
 */
export type SignalKind = "objection" | "pain" | "positive";
export type SpecialistKind = "gtm" | "competitor" | "financial" | "research" | "fundraising" | "brainstorm";
export interface CompanyProfile {
  buyer: string; endUser: string; offer: string; pricing: string;
  competitors: string; constraints: string;
}
export interface CustomerSignal {
  id: string; evidenceId: string; kind: SignalKind; persona: string;
  quote: string; source: string; recordedAt: string;
}
export interface PivotRule {
  metric: string; threshold: number; current: number; deadline: string;
  fallback: string;
}
export interface FounderMove {
  id: string; title: string; reason: string; evidenceIds: string[];
  complete: boolean;
}
export interface FounderIntelligenceState {
  version: 1; revision: number; profile: CompanyProfile;
  signals: CustomerSignal[]; rule?: PivotRule;
  moves: FounderMove[]; plannedAt?: string;
}
const fields: Array<keyof CompanyProfile> = ["buyer","endUser","offer","pricing","competitors","constraints"];
const blank: CompanyProfile = {buyer:"",endUser:"",offer:"",pricing:"",competitors:"",constraints:""};
export function initialFounderIntelligence(): FounderIntelligenceState {
  return {version:1,revision:0,profile:{...blank},signals:[],moves:[]};
}
export function redactSensitive(input: string): string {
  return input
    .replace(/\b(?:sk-(?:proj-|live-)?[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|github_pat_[A-Za-z0-9_]{12,}|AKIA[0-9A-Z]{16})\b/g,"[REDACTED_SECRET]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]{12,}/gi,"Bearer [REDACTED_SECRET]")
    .replace(/\b(password|api[_-]?key|client[_-]?secret)\s*[:=]\s*[^\s,;]+/gi,"$1=[REDACTED_SECRET]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[REDACTED_EMAIL]");
}
function scrub(value: unknown, max: number): string {
  return redactSensitive(typeof value === "string" ? value.trim().slice(0,max) : "");
}
export function updateCompanyProfile(state:FounderIntelligenceState, input:Partial<CompanyProfile>):FounderIntelligenceState {
  const profile={...state.profile};
  for (const key of fields) if (Object.prototype.hasOwnProperty.call(input,key)) profile[key]=scrub(input[key],1000);
  return {...state,profile,revision:state.revision+1};
}
export function addCustomerSignal(state:FounderIntelligenceState, input:{
  evidenceId:string;kind:SignalKind;quote:string;persona:string;source?:string;
}, id:string, now=new Date()):FounderIntelligenceState {
  if(!["objection","pain","positive"].includes(input.kind)) throw new Error("Unsupported signal kind");
  const quote=scrub(input.quote,4000);
  if (quote.length<12) throw new Error("Customer quote must have at least 12 characters");
  if (!input.evidenceId) throw new Error("An evidence record is required");
  const item:CustomerSignal={id,evidenceId:input.evidenceId,kind:input.kind,quote,persona:scrub(input.persona,160),source:scrub(input.source??"",160),recordedAt:now.toISOString()};
  return {...state,signals:[item,...state.signals].slice(0,250),revision:state.revision+1};
}
export function setPivotRule(state:FounderIntelligenceState, rule:PivotRule):FounderIntelligenceState {
  if (!rule.metric?.trim() || rule.metric.length>120 || !rule.fallback?.trim() || rule.fallback.length>500) throw new Error("Metric and fallback are required");
  if (!Number.isFinite(rule.threshold) || rule.threshold<=0 || !Number.isFinite(rule.current) || rule.current<0) throw new Error("Invalid pivot threshold or current value");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rule.deadline) || new Date(rule.deadline+"T00:00:00Z").toISOString().slice(0,10)!==rule.deadline) throw new Error("Invalid ISO deadline");
  return {...state,rule:{metric:scrub(rule.metric,120),fallback:scrub(rule.fallback,500),threshold:rule.threshold,current:rule.current,deadline:rule.deadline},revision:state.revision+1};
}
export function evaluatePivot(rule:PivotRule|undefined,now=new Date()):{status:"unset"|"achieved"|"tracking"|"review";detail:string} {
  if (!rule) return {status:"unset",detail:"Set a measurable rule before evaluating a pivot."};
  if (rule.current>=rule.threshold) return {status:"achieved",detail:`Goal met: ${rule.current}/${rule.threshold} ${rule.metric}.`};
  const cutoff=new Date(rule.deadline+"T23:59:59.999Z");
  if (now<=cutoff) return {status:"tracking",detail:`Tracking: ${rule.current}/${rule.threshold} ${rule.metric}. Deadline ${rule.deadline}.`};
  return {status:"review",detail:`Below threshold at deadline: ${rule.current}/${rule.threshold} ${rule.metric}. Founder review needed; proposed alternative: ${rule.fallback}. No automatic pivot.`};
}
export function replanFounderDay(state:FounderIntelligenceState, now=new Date()):FounderIntelligenceState {
  const actions:FounderMove[]=[];
  for (const kind of ["objection","pain","positive"] as const) {
    const signal=state.signals.find(s=>s.kind===kind);
    if (!signal) continue;
    const title=kind==="objection"?"Investigate the strongest customer objection":kind==="pain"?"Validate the highest-priority customer pain":"Validate repeatability of positive feedback";
    actions.push({id:crypto.randomUUID(),title,reason:`Customer ${kind} recorded ${signal.recordedAt.slice(0,10)}: “${signal.quote.slice(0,180)}”`,evidenceIds:[signal.evidenceId],complete:false});
  }
  if (!actions.length) actions.push({id:crypto.randomUUID(),title:"Conduct three discovery interviews",reason:"No customer interview evidence is recorded yet; validate the ICP hypothesis.",evidenceIds:[],complete:false});
  if (state.rule && evaluatePivot(state.rule,now).status==="review") actions.unshift({id:crypto.randomUUID(),title:"Review expired pivot decision rule",reason:evaluatePivot(state.rule,now).detail,evidenceIds:[],complete:false});
  return {...state,moves:actions.slice(0,4),plannedAt:now.toISOString(),revision:state.revision+1};
}
export function setMoveComplete(state:FounderIntelligenceState,id:string,complete:boolean):FounderIntelligenceState {
  if(!state.moves.some(move=>move.id===id)) throw new Error("Move not found");
  return {...state,moves:state.moves.map(move=>move.id===id?{...move,complete}:move),revision:state.revision+1};
}
export function specialistArtifact(kind:SpecialistKind,state:FounderIntelligenceState):string {
  const headings:Record<SpecialistKind,string>={gtm:"GTM Message Draft",competitor:"Competitor Hypothesis Audit",financial:"Founder Financial Assumption Check",research:"Research Questions",fundraising:"Fundraising Narrative Outline",brainstorm:"Hypothesis Stress Test"};
  const items=state.signals.slice(0,8).map(s=>`- [Evidence ${s.evidenceId}] (${s.kind}, ${s.persona||"persona unrecorded"}): “${s.quote.replace(/\n/g," ")}”`).join("\n");
  const recommendation:Record<SpecialistKind,string>={
    gtm:"Draft messaging only from validated customer pain; obtain founder approval before any contact.",
    competitor:"Compare the named alternative against each objection; feature claims require external verification.",
    financial:"Model cash, burn and conversion using verified numbers; do not infer revenue or runway from interview quotes.",
    research:"Research competitor prices, adoption rates and objections with URL, retrieval date and fact/assumption labels.",
    fundraising:"Lead with verifiable traction and label forecast numbers as assumptions.",
    brainstorm:"Design a seven-day falsification experiment around the highest-risk untested assumption."
  };
  return `# ${headings[kind]}\n\nGenerated from founder-supplied, saved context. **Review-only draft; not independently researched or sent.**\n\n## Company context\n- Economic buyer: ${state.profile.buyer||"Unknown"}\n- User: ${state.profile.endUser||"Unknown"}\n- Offer: ${state.profile.offer||"Unknown"}\n- Pricing (founder claim): ${state.profile.pricing||"Unknown"}\n- Alternatives (unverified): ${state.profile.competitors||"Unknown"}\n- Constraints: ${state.profile.constraints||"Unknown"}\n\n## Customer evidence\n${items||"No interview evidence. Do not invent testimonials."}\n\n## Recommended next step\n${recommendation[kind]}\n\n## Pivot status\n${evaluatePivot(state.rule).detail}\n\n> No automated outreach, fabricated citations, verified financial statements or silent company-file edits.\n`;
}
