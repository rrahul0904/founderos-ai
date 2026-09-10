create extension if not exists pgcrypto;
create table if not exists organizations (id uuid primary key, name text not null, created_at timestamptz not null default now());
insert into organizations (id,name) values ('00000000-0000-4000-8000-000000000001','FounderOS Development') on conflict (id) do nothing;

alter table projects add column if not exists organization_id uuid;
update projects set organization_id='00000000-0000-4000-8000-000000000001' where organization_id is null;
alter table projects alter column organization_id set not null;
alter table projects add column if not exists daily_budget_usd numeric(12,6) not null default 2.00;
alter table projects add column if not exists per_run_budget_usd numeric(12,6) not null default 0.50;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='projects_organization_id_fkey') then
    alter table projects add constraint projects_organization_id_fkey foreign key (organization_id) references organizations(id) on delete cascade;
  end if;
end $$;

alter table evidence add column if not exists title text;
alter table evidence add column if not exists content_hash text;
alter table jobs add column if not exists organization_id uuid;
update jobs j set organization_id=p.organization_id from projects p where j.project_id=p.id and j.organization_id is null;
alter table jobs alter column organization_id set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='jobs_organization_id_fkey') then
    alter table jobs add constraint jobs_organization_id_fkey foreign key (organization_id) references organizations(id) on delete cascade;
  end if;
end $$;

create table if not exists audit_events (
  id bigserial primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  actor_user_id uuid,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists projects_org_updated_idx on projects(organization_id, updated_at desc);
create index if not exists evidence_hash_idx on evidence(project_id, content_hash) where content_hash is not null;
create index if not exists jobs_project_idx on jobs(project_id, created_at desc);
create index if not exists audit_events_project_idx on audit_events(project_id, occurred_at desc);

create table if not exists source_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  source_url text not null,
  content_hash text not null,
  content_type text,
  captured_text text not null,
  captured_at timestamptz not null default now(),
  unique(project_id, content_hash)
);
create table if not exists claims (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  statement text not null,
  status text not null default 'hypothesis',
  confidence numeric(5,4) not null default 0.5 check (confidence>=0 and confidence<=1),
  created_at timestamptz not null default now()
);
create table if not exists claim_evidence (
  claim_id uuid not null references claims(id) on delete cascade,
  evidence_id uuid not null references evidence(id) on delete cascade,
  relationship text not null default 'supports',
  primary key(claim_id,evidence_id)
);
