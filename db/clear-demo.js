require("dotenv").config();
const db=require("./index");
(async()=>{await db.init();await db.query(`DELETE FROM organizations WHERE id='org_demo_1'`);console.log('Demo workspace and all related demo data removed.');await db.close()})().catch(async e=>{console.error(e);try{await db.close()}catch{}process.exit(1)});
