import { createHash } from "node:crypto";
import {
  DEV_ORGANIZATION_ID,
  createProject,
  normalizeConfidence,
  readinessForStage,
  type AgentRunRecord,
  type BudgetStatus,
  type ClaimRecord,
  type EvidenceRecord,
  type EvidenceSourceType,
  type FounderProject,
  type LifecycleStage
} from "@founderos/core";
import { PostgresFounderRepository, createPool } from "@founderos/db";

interface RuntimeMemory {
  projects: Map<string, FounderProject>;
  evidence: Map<string, EvidenceRecord[]>;
  jobs: Map<string, Array<Record<string, unknown>>>;
  claims: Map<string, ClaimRecord[]>;
}

declare global { var founderOSRuntimeMemory: RuntimeMemory | undefined; }
const memory: RuntimeMemory = globalThis.founderOSRuntimeMemory ?? { projects:new Map(), evidence:new Map(), jobs:new Map(), claims:new Map() };
if (process.env.NODE_ENV !== "production") globalThis.founderOSRuntimeMemory = memory;
let postgres: PostgresFounderRepository | null | undefined;
function pgRepo(){ if(!process.env.DATABASE_URL)return null; if(postgres===undefined)postgres=new PostgresFounderRepository(createPool()); return postgres; }
export function runtimeMode(){ return process.env.DATABASE_URL ? "postgres" : "memory"; }
export async function listProjects(organizationId=DEV_ORGANIZATION_ID){ const repo=pgRepo(); if(repo)return repo.listProjects(organizationId); return Array.from(memory.projects.values()).filter(p=>p.organizationId===organizationId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)); }
export async function getProject(id:string,organizationId=DEV_ORGANIZATION_ID){ const repo=pgRepo(); if(repo)return repo.getProject(id,organizationId); const project=memory.projects.get(id)??null; return project?.organizationId===organizationId?project:null; }
export async function addProject(idea:string,organizationId=DEV_ORGANIZATION_ID){ const project=createProject(idea,organizationId); const repo=pgRepo(); if(repo){await repo.upsertProject(project);await repo.writeAudit({organizationId,projectId:project.id,eventName:"project.created"});}else memory.projects.set(project.id,project); return project; }
export async function updateProject(id:string,organizationId:string,patch:Partial<FounderProject>){const current=await getProject(id,organizationId);if(!current)return null;const updated={...current,...patch,organizationId,updatedAt:new Date().toISOString()};const repo=pgRepo();if(repo)await repo.upsertProject(updated);else memory.projects.set(id,updated);return updated;}
export async function appendAgentRun(id:string,organizationId:string,run:AgentRunRecord){const current=await getProject(id,organizationId);if(!current)return null;const updated=await updateProject(id,organizationId,{runs:[run,...current.runs].slice(0,50),stage:run.stage as LifecycleStage,readiness:readinessForStage(run.stage as LifecycleStage),latestOutput:run.output});const repo=pgRepo();if(repo){await repo.addAgentRun(id,organizationId,run,{stage_before:current.stage});await repo.writeAudit({organizationId,projectId:id,eventName:"agent.completed",properties:{agent:run.agent,provider:run.provider,cost_usd:run.costUsd??0}});}return updated;}
export async function listEvidence(projectId:string,organizationId:string,limit=100){const repo=pgRepo();if(repo)return repo.listEvidence(projectId,organizationId,limit);return(memory.evidence.get(projectId)??[]).slice(0,limit);}
export async function addEvidence(input:{projectId:string;organizationId:string;sourceType:EvidenceSourceType;sourceUrl?:string|null;title?:string|null;claim:string;excerpt?:string|null;confidence?:number;metadata?:Record<string,unknown>}){const record:EvidenceRecord={id:crypto.randomUUID(),projectId:input.projectId,sourceType:input.sourceType,sourceUrl:input.sourceUrl??null,title:input.title??null,claim:input.claim,excerpt:input.excerpt??null,confidence:normalizeConfidence(input.confidence??0.6),contentHash:createHash("sha256").update(`${input.sourceUrl??""}\n${input.claim}\n${input.excerpt??""}`).digest("hex"),collectedAt:new Date().toISOString(),metadata:input.metadata??{}};const repo=pgRepo();if(repo){await repo.addEvidence(record,input.organizationId);await repo.writeAudit({organizationId:input.organizationId,projectId:input.projectId,eventName:"evidence.created",properties:{evidence_id:record.id,source_type:record.sourceType}});}else{const current=memory.evidence.get(input.projectId)??[];memory.evidence.set(input.projectId,[record,...current]);}return record;}
export async function enqueueResearch(input:{projectId:string;organizationId:string;kind:"research.capture_url"|"research.search";payload:Record<string,unknown>;idempotencyKey?:string}){const repo=pgRepo();if(!repo){const id=crypto.randomUUID();const current=memory.jobs.get(input.projectId)??[];memory.jobs.set(input.projectId,[{id,kind:input.kind,status:"queued",created_at:new Date().toISOString(),note:"Worker requires DATABASE_URL"},...current]);return id;}const id=await repo.enqueueJob(input);await repo.writeAudit({organizationId:input.organizationId,projectId:input.projectId,eventName:"research.queued",properties:{job_id:id,kind:input.kind}});return id;}
export async function listJobs(projectId:string,organizationId:string){const repo=pgRepo();if(repo)return repo.listJobs(projectId,organizationId);return memory.jobs.get(projectId)??[];}
export async function getBudgetStatus(projectId:string,organizationId:string):Promise<BudgetStatus>{const repo=pgRepo();if(repo)return repo.getBudgetStatus(projectId,organizationId);return{dailyBudgetUsd:2,perRunBudgetUsd:.5,spentTodayUsd:0,remainingTodayUsd:2};}
export async function setBudget(projectId:string,organizationId:string,dailyBudgetUsd:number,perRunBudgetUsd:number){const repo=pgRepo();if(repo){const status=await repo.setBudget(projectId,organizationId,dailyBudgetUsd,perRunBudgetUsd);await repo.writeAudit({organizationId,projectId,eventName:"budget.updated",properties:{daily_budget_usd:dailyBudgetUsd,per_run_budget_usd:perRunBudgetUsd}});return status;}return{dailyBudgetUsd,perRunBudgetUsd,spentTodayUsd:0,remainingTodayUsd:dailyBudgetUsd};}
export async function listAudit(projectId:string,organizationId:string){const repo=pgRepo();if(repo)return repo.listAudit(projectId,organizationId);return[];}
export async function listClaims(projectId:string,organizationId:string){const repo=pgRepo();if(repo)return repo.listClaims(projectId,organizationId);return memory.claims.get(projectId)??[];}
export async function addClaim(projectId:string,organizationId:string,statement:string,evidenceIds:string[],confidence=.5){const claim:ClaimRecord={id:crypto.randomUUID(),projectId,statement,status:evidenceIds.length?"supported":"hypothesis",confidence:normalizeConfidence(confidence),evidenceIds,createdAt:new Date().toISOString()};const repo=pgRepo();if(repo){await repo.addClaim(claim,organizationId);await repo.writeAudit({organizationId,projectId,eventName:"claim.created",properties:{claim_id:claim.id,evidence_count:evidenceIds.length}});}else memory.claims.set(projectId,[claim,...(memory.claims.get(projectId)??[])]);return claim;}
