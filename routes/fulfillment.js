const router = require("express").Router();
const db = require("../db");
const fulfill = require("../services/fulfillmentService");
const { requireAuth } = require("../middleware/auth");
const jobs = require("../services/jobQueue");

router.use(requireAuth);
router.get("/touchpoints", async (req, res) => {
  const rows = (await db.query("SELECT * FROM touchpoints WHERE organization_id=$1 ORDER BY created_at DESC", [req.user.organization_id])).rows;
  res.json(rows);
});

router.post("/send", async (req, res) => {
  try {
    if (!['owner', 'admin'].includes(req.user.role)) return res.status(403).json({ error: "approval_required" });
    if (process.env.ENABLE_LIVE_FULFILLMENT !== "true") return res.status(503).json({ error: "live_fulfillment_disabled" });
    const account = (await db.query("SELECT * FROM accounts WHERE id=$1 AND organization_id=$2", [req.body.accountId, req.user.organization_id])).rows[0];
    const contact = (await db.query("SELECT * FROM contacts WHERE id=$1 AND organization_id=$2", [req.body.contactId, req.user.organization_id])).rows[0];
    if (!account || !contact) return res.status(404).json({ error: "account_or_contact_not_found" });
    const job = await jobs.enqueue(req.user.organization_id, "JOB_DISPATCH_FULFILLMENT", {
      organizationId: req.user.organization_id, campaignId: req.body.campaignId, accountId: account.id, contactId: contact.id,
      touchType: req.body.touchType || "PERSONALIZED_POSTCARD", cost: Number(req.body.cost || 12), copy: req.body.copy || ""
    });
    res.status(202).json({ accepted: true, job_id: job.id });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
module.exports = router;
