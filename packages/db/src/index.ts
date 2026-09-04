import pg from "pg";
import type { FounderProject } from "@founderos/core";

export interface ProjectRepository {
  get(id: string): Promise<FounderProject | null>;
  list(): Promise<FounderProject[]>;
  upsert(project: FounderProject): Promise<void>;
}

export function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL is required for PostgreSQL persistence");
  return new pg.Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
}

export class PostgresProjectRepository implements ProjectRepository {
  constructor(private readonly pool: pg.Pool) {}

  async get(id: string) {
    const result = await this.pool.query("select payload from projects where id = $1", [id]);
    return (result.rows[0]?.payload as FounderProject | undefined) ?? null;
  }

  async list() {
    const result = await this.pool.query("select payload from projects order by updated_at desc limit 100");
    return result.rows.map((row) => row.payload as FounderProject);
  }

  async upsert(project: FounderProject) {
    await this.pool.query(
      `insert into projects (id, name, stage, payload, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (id) do update set name=excluded.name, stage=excluded.stage, payload=excluded.payload, updated_at=excluded.updated_at`,
      [project.id, project.name, project.stage, project, project.createdAt, project.updatedAt]
    );
  }
}
