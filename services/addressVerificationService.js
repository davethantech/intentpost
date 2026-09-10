function verify(address){
 const value=String(address||"").trim();
 if(!value)return {status:"invalid",reason:"missing address"};
 const parts=value.split(",").map(x=>x.trim()).filter(Boolean);
 return parts.length>=3?{status:"verified",normalized:value,confidence:.9}:{status:"unknown",reason:"sandbox verifier requires a full street/city/region address"};
}
module.exports={verify};
