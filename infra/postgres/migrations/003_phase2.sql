create table if not exists build_executions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid not null,
  repository text not null,
  branch_name text not null,
  base_branch text not null,
  work_order text not null,
  status text not null default 'queued' check(status in ('queued','running','completed','failed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  leased_until timestamptz,
  last_error text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(project_id,plan_id)
);
create index if not exists build_executions_claim_idx on build_executions(status,available_at,created_at);
create index if not exists build_executions_project_idx on build_executions(project_id,created_at desc);
