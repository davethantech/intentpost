require("dotenv").config();
const db = require("./index");
(async () => {
  await db.init();
  const q = db.query.bind(db), org = "org_demo_1";
  await q(`INSERT INTO organizations(id,name,slug) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`, [org, "Acme Global Enterprises", "acme-global"]);
  const accounts = [["acme","Acme","acme.example","B2B SaaS",85000,94,91],["globex","Globex","globex.example","B2B SaaS",42000,89,83],["nova","Nova","nova.example","Technology",30000,87,79],["initech","Initech","initech.example","Software",18000,63,44]];
  for (const a of accounts) await q(`INSERT INTO accounts(id,organization_id,name,domain,industry,acv,intent_score,physical_intervention_score) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`, [a[0],org,...a.slice(1)]);
  await q(`INSERT INTO contacts(id,organization_id,account_id,name,title,email,address,address_status,persona_type,intent_score) VALUES
   ('sarah','org_demo_1','acme','Sarah Chen','VP Sales','sarah@acme.example','1 Market St, San Francisco, CA','verified','executive',94),
   ('michael','org_demo_1','globex','Michael Ross','CRO','michael@globex.example','1 Main St, Austin, TX','verified','executive',89),
   ('jessica','org_demo_1','nova','Jessica Lee','RevOps','jessica@nova.example','1 Pine St, New York, NY','verified','revops',87)
   ON CONFLICT DO NOTHING`);
  await q(`INSERT INTO signals(id,organization_id,account_id,contact_id,signal_type,signal_name,strength,payload) VALUES
   ('sig1','org_demo_1','acme','sarah','buying_intent','pricing_page_return',95,'{"source":"web"}'),
   ('sig2','org_demo_1','globex','michael','buying_intent','demo_request',92,'{"source":"crm"}'),
   ('sig3','org_demo_1','nova','jessica','engagement','revops_research',86,'{"source":"content"}') ON CONFLICT DO NOTHING`);
  await q(`INSERT INTO campaigns(id,organization_id,name,budget,spent,status) VALUES('camp_demo','org_demo_1','Executive ABM Q3',5000,0,'active') ON CONFLICT DO NOTHING`);
  await db.close();
  console.log("Seed complete");
})().catch(async e => { console.error(e); try { await db.close(); } catch {} process.exit(1); });
