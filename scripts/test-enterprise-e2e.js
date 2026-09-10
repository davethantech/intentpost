require("dotenv").config();
const assert = require("assert");
const db = require("../db");
const { app } = require("../server");

(async () => {
  assert.ok(app && app._router, "Express application loaded");
  await db.init();
  const result = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('organizations','accounts','contacts','signals','campaigns','jobs','touchpoints','ai_decision_audits')`);
  const tables = new Set(result.rows.map(r => r.table_name));
  for (const name of ['organizations','accounts','contacts','signals','campaigns','jobs','touchpoints','ai_decision_audits']) assert.ok(tables.has(name), `missing table: ${name}`);
  const job = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='jobs' AND column_name IN ('next_run_at','locked_at','max_attempts')");
  assert.equal(job.rows.length, 3, "production job columns missing");
  await db.close();
  console.log("Enterprise production smoke test: PASS");
})().catch(async e => { console.error(e); try { await db.close(); } catch {} process.exit(1); });
