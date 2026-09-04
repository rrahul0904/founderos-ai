import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required for the durable worker");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 4 });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function claim() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await client.query(`
      select id, kind, payload
      from jobs
      where status = 'queued' and available_at <= now()
      order by created_at asc
      for update skip locked
      limit 1
    `);
    const job = result.rows[0];
    if (!job) { await client.query("commit"); return null; }
    await client.query("update jobs set status='running', leased_until=now()+interval '60 seconds', attempts=attempts+1 where id=$1", [job.id]);
    await client.query("commit");
    return job as { id: string; kind: string; payload: unknown };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function complete(id: string) {
  await pool.query("update jobs set status='completed', completed_at=now(), leased_until=null where id=$1", [id]);
}

console.log("FounderOS worker started");
while (true) {
  const job = await claim();
  if (!job) { await sleep(1500); continue; }
  console.log(`processing ${job.kind} ${job.id}`);
  // Phase 1 will route research/browser/build jobs to isolated executors.
  await complete(job.id);
}
