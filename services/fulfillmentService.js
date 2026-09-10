const db = require("../db");
const crypto = require("crypto");
const qrcode = require("qrcode");
const adapters = { mock: require("./fulfillmentAdapters/mockAdapter"), lob: require("./fulfillmentAdapters/lobAdapter"), postal: require("./fulfillmentAdapters/postalAdapter") };

async function create({ org, campaignId, account, contact, touchType, cost = 0, copy = "" }) {
  const selected = process.env.FULFILLMENT_PROVIDER || "mock";
  if (selected !== "mock" && process.env.ENABLE_LIVE_FULFILLMENT !== "true") throw new Error("live fulfillment is disabled");
  if (!adapters[selected]) throw new Error(`unsupported fulfillment provider: ${selected}`);
  if (!account || !contact) throw new Error("account and contact are required");
  const code = "IP-" + crypto.randomBytes(5).toString("hex").toUpperCase();
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const qrUrl = `${base}/r/${code}`;
  const adapter = adapters[selected];
  const provider = await adapter.send({ account, contact, touchType, cost, copy });
  const row = { id: crypto.randomUUID(), organization_id: org, campaign_id: campaignId, contact_id: contact.id, account_id: account.id, touch_type: touchType, status: provider.status || "queued", tracking_code: code, qr_url: qrUrl, cost, fulfillment_provider: provider.provider || selected, fulfillment_id: provider.id, recipient_address: contact.address, copy_generated: copy };
  await db.query(`INSERT INTO touchpoints(id,organization_id,campaign_id,contact_id,account_id,touch_type,status,tracking_code,qr_url,cost,fulfillment_provider,fulfillment_id,recipient_address,copy_generated) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, Object.values(row));
  return { ...row, qr_svg: await qrcode.toString(qrUrl, { type: "svg", margin: 1 }) };
}
module.exports = { create };
