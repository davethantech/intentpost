require("dotenv").config();const assert=require("assert"),http=require("http"),db=require("../db");
(async()=>{await db.init();assert.ok(["memory","postgres"].includes(db.mode));const server=http.createServer(require("../server").app||(()=>{}));server.close?.();console.log("Enterprise smoke test: PASS (database init + module load)")})().catch(e=>{console.error(e);process.exit(1)});
