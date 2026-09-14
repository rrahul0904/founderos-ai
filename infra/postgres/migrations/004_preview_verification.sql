create table if not exists preview_verifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid not null,
  provider text not null check(provider in ('vercel')),
  deployment_id text not null,
  deployment_url text not null,
  expected_commit_sha text not null,
  status text not null default 'queued' check(status in ('queued','running','passed','failed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  leased_until timestamptz,
  last_error text,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(project_id,plan_id,deployment_id)
);
create index if not exists preview_verifications_claim_idx on preview_verifications(status,available_at,created_at);
create index if not exists preview_verifications_project_idx on preview_verifications(project_id,created_at desc);
