const db=require("../db");
async function recompute(accountId,org){
 const acc=db.mode==="postgres"?(await db.query("SELECT * FROM accounts WHERE id=$1 AND organization_id=$2",[accountId,org])).rows[0]:db.first("accounts",x=>x.id===accountId&&x.organization_id===org);
 if(!acc)return null;
 const signals=db.mode==="postgres"?(await db.query("SELECT * FROM signals WHERE organization_id=$1 AND account_id=$2 ORDER BY occurred_at DESC LIMIT 50",[org,accountId])).rows:db.all("signals",x=>x.organization_id===org&&x.account_id===accountId);
 const score=Math.min(100,Math.round(signals.reduce((s,x)=>s+Number(x.strength||0),0)/Math.max(1,signals.length)));
 const physical=Math.min(100,Math.round(score*.55+Math.min(100,Number(acc.acv||0)/1000)*.25+20));
 if(db.mode==="postgres")await db.query("UPDATE accounts SET intent_score=$1,physical_intervention_score=$2 WHERE id=$3 AND organization_id=$4",[score,physical,accountId,org]);
 else{acc.intent_score=score;acc.physical_intervention_score=physical}
 return {account:acc,signals,intent_score:score,physical_intervention_score:physical};
}
async function accountGraph(accountId,org){
 const out={nodes:[],edges:[]};
 const add=(type,n)=>out.nodes.push({id:n.id,type,...n});
 const acc=db.mode==="postgres"?(await db.query("SELECT * FROM accounts WHERE id=$1 AND organization_id=$2",[accountId,org])).rows[0]:db.first("accounts",x=>x.id===accountId&&x.organization_id===org);
 if(!acc)return out; add("account",acc);
 const contacts=db.mode==="postgres"?(await db.query("SELECT * FROM contacts WHERE account_id=$1 AND organization_id=$2",[accountId,org])).rows:db.all("contacts",x=>x.account_id===accountId&&x.organization_id===org);
 for(const c of contacts){add("contact",c);out.edges.push({source:accountId,target:c.id,type:"CONTACT"})}
 const sigs=db.mode==="postgres"?(await db.query("SELECT * FROM signals WHERE account_id=$1 AND organization_id=$2",[accountId,org])).rows:db.all("signals",x=>x.account_id===accountId&&x.organization_id===org);
 for(const s of sigs){add("signal",s);out.edges.push({source:accountId,target:s.id,type:"SIGNAL"})}
 return out;
}
module.exports={recompute,accountGraph};
