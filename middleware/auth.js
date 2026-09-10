const jwt=require("jsonwebtoken");
const secret=()=>process.env.JWT_SECRET||"change-me-in-production";
function signAccess(user){return jwt.sign(user,secret(),{expiresIn:process.env.ACCESS_TTL||"15m"})}
function requireAuth(req,res,next){const h=req.headers.authorization||"";const token=h.startsWith("Bearer ")?h.slice(7):null;if(!token)return res.status(401).json({error:"authentication required"});try{req.user=jwt.verify(token,secret());next()}catch(e){return res.status(401).json({error:"invalid or expired token"})}}
module.exports={signAccess,requireAuth};
