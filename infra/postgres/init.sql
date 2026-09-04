create extension if not exists pgcrypto;

create table if not exists projects (
  id uuid primary key,
  name text not null,
  stage text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  source_url text,
  source_type text not null,
  claim text not null,
  excerpt text,
  confidence numeric(5,4),
  collected_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists evidence_project_idx on evidence(project_id, collected_at desc);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  rationale text not null,
  status text not null default 'proposed',
  evidence_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists agent_runs (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  agent text not null,
  provider text not null,
  model text,
  status text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(12,6),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists agent_runs_project_idx on agent_runs(project_id, created_at desc);

create table if not exists product_events (
  id bigserial primary key,
  project_id uuid references projects(id) on delete cascade,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists product_events_project_idx on product_events(project_id, occurred_at desc);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text unique,
  status text not null default 'queued',
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  available_at timestamptz not null default now(),
  leased_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists jobs_claim_idx on jobs(status, available_at, created_at);
