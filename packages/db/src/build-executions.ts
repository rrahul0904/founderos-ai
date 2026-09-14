import pg from "pg";
import type { BuildExecutionRecord } from "@founderos/core";

export interface BuildExecutionInput {
  projectId: string;
  organizationId: string;
  planId: string;
  repository: string;
  branchName: string;
  baseBranch: string;
  workOrder: string;
}

let pool: pg.Pool | undefined;
function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for build execution");
  pool ??= new pg.Pool({ connectionString, max: 4, idleTimeoutMillis: 30_000 });
  return pool;
}

function rowToExecution(row: Record<string, unknown>): BuildExecutionRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    organizationId: String(row.organization_id),
    planId: String(row.plan_id),
    repository: String(row.repository),
    branchName: String(row.branch_name),
    baseBranch: String(row.base_branch),
    status: row.status as BuildExecutionRecord["status"],
    attempts: Number(row.attempts ?? 0),
    lastError: row.last_error ? String(row.last_error) : null,
    result: (row.result as Record<string, unknown>) ?? {},
    createdAt: new Date(String(row.created_at)).toISOString(),
    completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : null
  };
}

export async function enqueueBuildExecution(input: BuildExecutionInput): Promise<BuildExecutionRecord> {
  const db = getPool();
  const result = await db.query(
    `insert into build_executions
      (project_id,organization_id,plan_id,repository,branch_name,base_branch,work_order)
     select $1,$2,$3,$4,$5,$6,$7
     where exists(select 1 from projects where id=$1 and organization_id=$2)
     on conflict(project_id,plan_id) do update set
       repository=excluded.repository,
       branch_name=excluded.branch_name,
       base_branch=excluded.base_branch,
       work_order=excluded.work_order,
       status=case when build_executions.status='failed' then 'queued' else build_executions.status end,
       attempts=case when build_executions.status='failed' then 0 else build_executions.attempts end,
       available_at=case when build_executions.status='failed' then now() else build_executions.available_at end,
       leased_until=case when build_executions.status='failed' then null else build_executions.leased_until end,
       last_error=case when build_executions.status='failed' then null else build_executions.last_error end,
       result=case when build_executions.status='failed' then '{}'::jsonb else build_executions.result end,
       completed_at=case when build_executions.status='failed' then null else build_executions.completed_at end
     returning *`,
    [input.projectId, input.organizationId, input.planId, input.repository, input.branchName, input.baseBranch, input.workOrder]
  );
  if (!result.rows[0]) throw new Error("Unable to enqueue build execution");
  return rowToExecution(result.rows[0]);
}

export async function getBuildExecution(input: { projectId: string; organizationId: string; executionId: string }): Promise<BuildExecutionRecord | null> {
  const result = await getPool().query(
    `select be.* from build_executions be
     join projects p on p.id=be.project_id
     where be.id=$1 and be.project_id=$2 and be.organization_id=$3 and p.organization_id=$3`,
    [input.executionId, input.projectId, input.organizationId]
  );
  return result.rows[0] ? rowToExecution(result.rows[0]) : null;
}
