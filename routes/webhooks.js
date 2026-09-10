const router = require("express").Router();
const crypto = require("crypto");
const db = require("../db");
const jobs = require("../services/jobQueue");

function secretFor(provider) {
  const key = `WEBHOOK_SECRET_${String(provider).toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const secret = process.env[key] || process.env.WEBHOOK_SECRET_DEFAULT;
  if (!secret || secret.length < 16) throw new Error("webhook secret is not securely configured");
  return secret;
}
function verify(req) {
  const supplied = String(req.headers["x-intentpost-signature"] || "");
  if (!supplied) return false;
  const expected = crypto.createHmac("sha256", secretFor(req.params.provider)).update(JSON.stringify(req.body || {})).digest("hex");
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

router.post("/:provider", async (req, res) => {
  try {
    if (!verify(req)) return res.status(401).json({ error: "invalid_webhook_signature" });
    const org = req.headers["x-intentpost-organization"] || req.body.organizationId;
    if (!org || !/^[a-zA-Z0-9_-]{1,100}$/.test(String(org))) return res.status(400).json({ error: "organization_required" });
    const key = req.headers["x-event-id"] || crypto.createHash("sha256").update(JSON.stringify(req.body)).digest("hex");
    const idem = await db.query(`INSERT INTO webhook_idempotency(id,organization_id,provider,event_key) VALUES($1,$2,$3,$4) ON CONFLICT (organization_id,provider,event_key) DO NOTHING`, [crypto.randomUUID(), org, req.params.provider, key]);
    if (idem.rowCount === 0) return res.status(200).json({ duplicate: true });
    const job = await jobs.enqueue(org, "JOB_INGEST_SIGNAL", req.body);
    return res.status(202).json({ accepted: true, job_id: job.id });
  } catch (e) {
    console.error(JSON.stringify({ event: "webhook_error", provider: req.params.provider, error: e.message }));
    return res.status(400).json({ error: "webhook_rejected" });
  }
});
module.exports = router;
