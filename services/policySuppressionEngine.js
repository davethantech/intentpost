const db=require("../db");
async function evaluate({org,account,contact,cost=0,campaign}){
 const reasons=[],checks={address_verified:false,opt_out:false,competitor:false,deceased:false,internal:false,restricted_region:false,budget_ok:true};
 checks.address_verified=contact?.address_status==="verified"; if(!checks.address_verified)reasons.push("Address is not verified");
 const vals=[contact?.email,contact?.phone,contact?.name,account?.domain].filter(Boolean).map(String).map(x=>x.toLowerCase());
 const suppressions=db.mode==="postgres"?(await db.query("SELECT * FROM suppressions WHERE organization_id=$1",[org])).rows:db.all("suppressions",x=>x.organization_id===org);
 for(const s of suppressions)if(vals.includes(String(s.value).toLowerCase())){if(s.type==="opt_out")checks.opt_out=true;if(s.type==="competitor")checks.competitor=true;if(s.type==="deceased")checks.deceased=true;if(s.type==="restricted_region")checks.restricted_region=true;reasons.push(`${s.type}: ${s.reason||"suppressed"}`)}
 checks.internal=String(contact?.email||"").toLowerCase().endsWith(`@${String(account?.domain||"").toLowerCase()}`); if(checks.internal)reasons.push("Internal domain");
 checks.budget_ok=Number(campaign?.spent||0)+cost<=Number(campaign?.budget??Infinity); if(!checks.budget_ok)reasons.push("Campaign budget exceeded");
 return {passed:reasons.length===0,reasons,checks};
}
module.exports={evaluate};
