const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/overview', async (req, res) => {
  const org = req.user.organization_id;
  const [accounts, signals, campaigns, touchpoints] = await Promise.all([
    db.query(`SELECT id,name,domain,industry,acv,intent_score,physical_intervention_score FROM accounts WHERE organization_id=$1 ORDER BY physical_intervention_score DESC,intent_score DESC`, [org]),
    db.query(`SELECT COUNT(*)::int AS count FROM signals WHERE organization_id=$1`, [org]),
    db.query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(budget),0)::numeric AS budget, COALESCE(SUM(spent),0)::numeric AS spent FROM campaigns WHERE organization_id=$1`, [org]),
    db.query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(cost),0)::numeric AS spend FROM touchpoints WHERE organization_id=$1`, [org])
  ]);
  res.json({
    user: { id:req.user.id, name:req.user.name, email:req.user.email, role:req.user.role, organization_id:org },
    metrics: {
      accounts: accounts.rows.length,
      signals: signals.rows[0].count,
      campaigns: campaigns.rows[0].count,
      campaign_budget: campaigns.rows[0].budget,
      campaign_spent: campaigns.rows[0].spent,
      touchpoints: touchpoints.rows[0].count,
      touchpoint_spend: touchpoints.rows[0].spend
    },
    accounts: accounts.rows
  });
});

router.get('/account/:id', async (req,res) => {
  const org=req.user.organization_id;
  const account=(await db.query('SELECT * FROM accounts WHERE id=$1 AND organization_id=$2',[req.params.id,org])).rows[0];
  if(!account) return res.status(404).json({error:'account_not_found'});
  const contacts=(await db.query('SELECT id,name,title,email,address_status,persona_type,intent_score FROM contacts WHERE account_id=$1 AND organization_id=$2 ORDER BY intent_score DESC',[req.params.id,org])).rows;
  const signals=(await db.query('SELECT id,signal_type,signal_name,strength,occurred_at,payload FROM signals WHERE account_id=$1 AND organization_id=$2 ORDER BY occurred_at DESC LIMIT 25',[req.params.id,org])).rows;
  const touchpoints=(await db.query('SELECT id,touch_type,status,cost,fulfillment_provider,tracking_code,created_at FROM touchpoints WHERE account_id=$1 AND organization_id=$2 ORDER BY created_at DESC LIMIT 25',[req.params.id,org])).rows;
  res.json({account,contacts,signals,touchpoints});
});

module.exports=router;
