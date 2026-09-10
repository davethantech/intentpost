require("dotenv").config();
const db=require("./index");
(async()=>{await db.init();await db.migrate();console.log("Migration complete:",db.mode)})().catch(e=>{console.error(e);process.exit(1)});
