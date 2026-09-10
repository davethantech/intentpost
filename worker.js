require("dotenv").config();
const db = require("./db");
const jobs = require("./services/jobQueue");
const ingest = require("./services/crmIngestion");
const engine = require("./services/aiDecisionEngine");
const fulfill = require("./services/fulfillmentService");

jobs.register("JOB_INGEST_SIGNAL", async payload => ingest.ingest(payload));
jobs.register("JOB_RUN_DECISION_ENGINE", async payload => {
  const rows = (await db.query(
    `SELECT a.id account_id, c.id contact_id FROM accounts a
     JOIN contacts c ON c.account_id=a.id AND c.organization_id=a.organization_id
     WHERE a.organization_id=$1 ORDER BY a.intent_score DESC LIMIT 100`,
    [payload.organizationId]
  )).rows;
  for (const row of rows) {
    const decision = await engine.evaluate({ org: payload.organizationId, accountId: row.account_id, contactId: row.contact_id, campaignId: payload.campaignId, cost: payload.cost || 12 });
    if (decision.decision === "SEND" && payload.autoFulfill === true) {
      await db.query(`UPDATE campaigns SET spent=spent+$1 WHERE id=$2 AND organization_id=$3 AND spent+$1 <= budget`, [decision.recommended_spend, payload.campaignId, payload.organizationId]);
      await fulfill.create({ org: payload.organizationId, campaignId: payload.campaignId, account: (await db.query("SELECT * FROM accounts WHERE id=$1 AND organization_id=$2", [row.account_id, payload.organizationId])).rows[0], contact: (await db.query("SELECT * FROM contacts WHERE id=$1 AND organization_id=$2", [row.contact_id, payload.organizationId])).rows[0], touchType: decision.experience, cost: decision.recommended_spend, copy: decision.message });
    }
  }
});
jobs.register("JOB_DISPATCH_FULFILLMENT", async p => {
  const account = (await db.query("SELECT * FROM accounts WHERE id=$1 AND organization_id=$2", [p.accountId, p.organizationId])).rows[0];
  const contact = (await db.query("SELECT * FROM contacts WHERE id=$1 AND organization_id=$2", [p.contactId, p.organizationId])).rows[0];
  if (!account || !contact) throw new Error("account/contact not found");
  await fulfill.create({ org: p.organizationId, campaignId: p.campaignId, account, contact, touchType: p.touchType, cost: p.cost, copy: p.copy });
});

const pollMs = Number(process.env.WORKER_POLL_MS || 1000);
let stopping = false;
async function loop() {
  while (!stopping) {
    const job = await jobs.claim();
    if (job) await jobs.runClaimed(job);
    else await new Promise(resolve => setTimeout(resolve, pollMs));
  }
}

(async () => {
  await db.init();
  console.log(JSON.stringify({ event: "worker_started", workerId: jobs.workerId }));
  await loop();
})().catch(error => { console.error(error); process.exit(1); });

for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, async () => { stopping = true; await db.close(); process.exit(0); });
