require("dotenv").config();
const crypto=require("crypto"),bcrypt=require("bcryptjs"),db=require("./index");
const DEMO_ORG="org_demo_1";
const PASSWORD=process.env.DEMO_PASSWORD;
if(!PASSWORD||PASSWORD.length<12)throw new Error("Set DEMO_PASSWORD to a temporary password of at least 12 characters before seeding demo data.");
const users=[
  ["demo-owner@intentpost.local","Demo Owner","owner"],
  ["demo-admin@intentpost.local","Demo Admin","admin"],
  ["demo-operator@intentpost.local","Demo Operator","operator"]
];
(async()=>{await db.init();
 await db.query(`INSERT INTO organizations(id,name,slug) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING`,[DEMO_ORG,"IntentPost Demo Workspace","intentpost-demo"]);
 const ph=await bcrypt.hash(PASSWORD,12);
 for(const [email,name,role] of users) await db.query(`INSERT INTO users(id,organization_id,email,password_hash,name,role,email_verified) VALUES($1,$2,$3,$4,$5,$6,true) ON CONFLICT(organization_id,email) DO UPDATE SET password_hash=EXCLUDED.password_hash,name=EXCLUDED.name,role=EXCLUDED.role,email_verified=true`,[crypto.randomUUID(),DEMO_ORG,email,ph,name,role]);
 const accounts=[["acme","Acme Global","acme.example","B2B SaaS",85000,94,91],["globex","Globex","globex.example","B2B SaaS",42000,89,83],["nova","Nova","nova.example","Technology",30000,87,79],["initech","Initech","initech.example","Software",18000,63,44]];
 for(const a of accounts)await db.query(`INSERT INTO accounts(id,organization_id,name,domain,industry,acv,intent_score,physical_intervention_score) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO NOTHING`,[a[0],DEMO_ORG,...a.slice(1)]);
 await db.query(`INSERT INTO contacts(id,organization_id,account_id,name,title,email,address,address_status,persona_type,intent_score) VALUES
 ('sarah',$1,'acme','Sarah Chen','VP Sales','sarah@acme.example','1 Market St, San Francisco, CA','verified','executive',94),
 ('michael',$1,'globex','Michael Ross','CRO','michael@globex.example','1 Main St, Austin, TX','verified','executive',89),
 ('jessica',$1,'nova','Jessica Lee','RevOps','jessica@nova.example','1 Pine St, New York, NY','verified','revops',87)
 ON CONFLICT(id) DO NOTHING`,[DEMO_ORG]);
 await db.query(`INSERT INTO signals(id,organization_id,account_id,contact_id,signal_type,signal_name,strength,payload,occurred_at) VALUES
 ('sig1',$1,'acme','sarah','buying_intent','pricing_page_return',95,'{"source":"web","visits":3}',now()-interval '2 hours'),
 ('sig2',$1,'globex','michael','buying_intent','demo_request',92,'{"source":"crm"}',now()-interval '5 hours'),
 ('sig3',$1,'nova','jessica','engagement','revops_research',86,'{"source":"content"}',now()-interval '1 day')
 ON CONFLICT(id) DO NOTHING`,[DEMO_ORG]);
 await db.query(`INSERT INTO campaigns(id,organization_id,name,budget,spent,status) VALUES('camp_demo',$1,'Executive ABM Demo',5000,0,'active') ON CONFLICT(id) DO NOTHING`,[DEMO_ORG]);
 await db.query(`INSERT INTO suppressions(id,organization_id,type,value,reason) VALUES('sup_demo',$1,'email','suppressed@example.com','Demo suppression example') ON CONFLICT(id) DO NOTHING`,[DEMO_ORG]);
 await db.query(`INSERT INTO graph_edges(id,organization_id,source_type,source_id,target_type,target_id,edge_type,weight) VALUES
 ('edge1',$1,'account','acme','contact','sarah','CONTACT',1),('edge2',$1,'account','acme','signal','sig1','SIGNAL',.95),('edge3',$1,'account','globex','contact','michael','CONTACT',1),('edge4',$1,'account','globex','signal','sig2','SIGNAL',.92),('edge5',$1,'account','nova','contact','jessica','CONTACT',1),('edge6',$1,'account','nova','signal','sig3','SIGNAL',.86)
 ON CONFLICT(id) DO NOTHING`,[DEMO_ORG]);
 console.log(`Demo seeded. Users: ${users.map(x=>x[0]).join(", ")}`);await db.close();
})().catch(async e=>{console.error(e);try{await db.close()}catch{}process.exit(1)});
