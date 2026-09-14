import pg from "pg";
import type { PreviewVerificationRecord } from "@founderos/core";

export interface PreviewVerificationInput {
  projectId: string;
  organizationId: string;
  planId: string;
  provider: "vercel";
  deploymentId: string;
  deploymentUrl: string;
  expectedCommitSha: string;
}

let pool: pg.Pool | undefined;
function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for preview verification");
  pool ??= new pg.Pool({ connectionString, max: 4, idleTimeoutMillis: 30000 });
  return pool;
}

function rowToRecord(row: Record<string, unknown>): PreviewVerificationRecord {
  return {
    id: String(row.id), projectId: String(row.project_id), organizationId: String(row.organization_id), planId: String(row.plan_id),
    provider: "vercel", deploymentId: String(row.deployment_id), deploymentUrl: String(row.deployment_url), expectedCommitSha: String(row.expected_commit_sha),
    status: row.status as PreviewVerificationRecord["status"], attempts: Number(row.attempts ?? 0), lastError: row.last_error ? String(row.last_error) : null,
    report: (row.report as Record<string, unknown>) ?? {}, createdAt: new Date(String(row.created_at)).toISOString(), completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : null
  };
}

export async function enqueuePreviewVerification(input: PreviewVerificationInput) {
  const result = await getPool().query(
    `insert into preview_verifications (project_id,organization_id,plan_id,provider,deployment_id,deployment_url,expected_commit_sha)
     select $1,$2,$3,$4,$5,$6,$7 where exists(select 1 from projects where id=$1 and organization_id=$2)
     on conflict(project_id,plan_id,deployment_id) do update set deployment_url=excluded.deployment_url, expected_commit_sha=excluded.expected_commit_sha,
       status=case when preview_verifications.status='failed' then 'queued' else preview_verifications.status end,
       attempts=case when preview_verifications.status='failed' then 0 else preview_verifications.attempts end,
       available_at=case when preview_verifications.status='failed' then now() else preview_verifications.available_at end,
       leased_until=case when preview_verifications.status='failed' then null else preview_verifications.leased_until end,
       last_error=case when preview_verifications.status='failed' then null else preview_verifications.last_error end,
       report=case when preview_verifications.status='failed' then '{}'::jsonb else preview_verifications.report end,
       completed_at=case when preview_verifications.status='failed' then null else preview_verifications.completed_at end
     returning *`,
    [input.projectId,input.organizationId,input.planId,input.provider,input.deploymentId,input.deploymentUrl,input.expectedCommitSha]
  );
  if (!result.rows[0]) throw new Error("Unable to enqueue preview verification");
  return rowToRecord(result.rows[0]);
}

export async function getPreviewVerification(input: { projectId: string; organizationId: string; verificationId: string }) {
  const result = await getPool().query(`select pv.* from preview_verifications pv join projects p on p.id=pv.project_id where pv.id=$1 and pv.project_id=$2 and pv.organization_id=$3 and p.organization_id=$3`, [input.verificationId,input.projectId,input.organizationId]);
  return result.rows[0] ? rowToRecord(result.rows[0]) : null;
}
