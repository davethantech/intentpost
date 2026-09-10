const router=require("express").Router();
const auth=require("../services/authService");
const {auth:authRateLimit}=require("../middleware/security");
const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:15*60*1000};
router.post("/register",authRateLimit,async(req,res)=>{try{const result=await auth.register(req.body);res.cookie("intentpost_access",result.token,cookieOptions);res.status(201).json({user:result.user})}catch(e){res.status(400).json({error:e.message})}});
router.post("/login",authRateLimit,async(req,res)=>{try{const result=await auth.login(req.body.email,req.body.password);res.cookie("intentpost_access",result.token,cookieOptions);res.json({user:result.user})}catch{res.status(401).json({error:"invalid credentials"})}});
router.post("/logout",(req,res)=>{res.clearCookie("intentpost_access",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/"});res.status(204).end()});
router.get("/me",require("../middleware/auth").requireAuth,(req,res)=>res.json({user:{id:req.user.id,organization_id:req.user.organization_id,email:req.user.email,name:req.user.name,role:req.user.role}}));
module.exports=router;
