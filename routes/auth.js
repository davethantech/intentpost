const router=require("express").Router(),auth=require("../services/authService");
router.post("/register",async(req,res)=>{try{res.json(await auth.register(req.body))}catch(e){res.status(400).json({error:e.message})}});
router.post("/login",async(req,res)=>{try{res.json(await auth.login(req.body.email,req.body.password))}catch(e){res.status(401).json({error:e.message})}});
module.exports=router;
