const crypto = require("crypto");

let pgPool = null;
let mode = "memory";
const memory = {
  organizations: [], users: [], refresh_tokens: [], accounts: [], contacts: [], signals: [],
  graph_edges: [], campaigns: [], touchpoints: [], suppressions: [], webhook_idempotency: [],
  webhook_dlq: [], attribution_events: [], ai_decision_audits: [], jobs: []
};
function id(){return crypto.randomUUID()}
async function init(){
  if(process.env.DATABASE_URL||process.env.PGHOST){
    try{const {Pool}=require("pg");pgPool=new Pool({connectionString:process.env.DATABASE_URL||undefined});await pgPool.query("SELECT 1");mode="postgres";return}catch(e){console.warn("PostgreSQL unavailable; using in-process fallback:",e.message)}
  }
  mode="memory";
}
async function query(sql,params=[]){if(mode!=="postgres")throw new Error("PostgreSQL is not active");return pgPool.query(sql,params)}
function insert(table,row){if(!memory[table])memory[table]=[];memory[table].push(row);return row}
function all(table,pred=()=>true){return (memory[table]||[]).filter(pred)}
function first(table,pred=()=>true){return all(table,pred)[0]||null}
async function migrate(){
  if(mode!=="postgres")return;
  const fs=require("fs"),path=require("path"),dir=path.join(__dirname,"migrations");
  const files=fs.readdirSync(dir).filter(x=>x.endsWith(".sql")).sort();
  for(const f of files)await query(fs.readFileSync(path.join(dir,f),"utf8"));
}
module.exports={init,get mode(){return mode},query,insert,all,first,migrate,id,memory};
