const db = require("../db");
const crypto = require("crypto");
const handlers = {};
const WORKER_ID = `${process.pid}-${crypto.randomUUID()}`;

function register(type, fn) { handlers[type] = fn; }

async function enqueue(organizationId, type, payload, options = {}) {
  const job = {
    id: crypto.randomUUID(), organization_id: organizationId, type,
    payload: JSON.stringify(payload), max_attempts: options.maxAttempts || 5
  };
  await db.query(
    `INSERT INTO jobs(id,organization_id,type,payload,max_attempts,next_run_at)
     VALUES($1,$2,$3,$4,$5,now())`,
    [job.id, organizationId, type, job.payload, job.max_attempts]
  );
  return { ...job, payload };
}

async function claim() {
  return db.transaction(async client => {
    const result = await client.query(`
      SELECT * FROM jobs
      WHERE status='queued' AND next_run_at <= now()
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED LIMIT 1`);
    const job = result.rows[0];
    if (!job) return null;
    await client.query(
      `UPDATE jobs SET status='running',locked_at=now(),locked_by=$1,attempts=attempts+1,updated_at=now() WHERE id=$2`,
      [WORKER_ID, job.id]
    );
    return job;
  });
}

async function runClaimed(job) {
  try {
    const handler = handlers[job.type];
    if (!handler) throw new Error(`No handler registered for ${job.type}`);
    await handler(typeof job.payload === "string" ? JSON.parse(job.payload) : job.payload);
    await db.query(`UPDATE jobs SET status='completed',completed_at=now(),locked_at=NULL,locked_by=NULL,updated_at=now() WHERE id=$1`, [job.id]);
  } catch (error) {
    const delaySeconds = Math.min(3600, 2 ** Math.min(job.attempts, 10) * 5);
    const terminal = job.attempts >= job.max_attempts;
    await db.query(`
      UPDATE jobs SET status=$1,last_error=$2,error_message=$2,locked_at=NULL,locked_by=NULL,
      next_run_at=CASE WHEN $1='queued' THEN now() + ($3 || ' seconds')::interval ELSE next_run_at END,
      updated_at=now() WHERE id=$4`,
      [terminal ? "failed" : "queued", error.message, String(delaySeconds), job.id]
    );
    if (terminal) console.error(JSON.stringify({ event: "job_failed", jobId: job.id, type: job.type, error: error.message }));
  }
}

module.exports = { register, enqueue, claim, runClaimed, workerId: WORKER_ID };
