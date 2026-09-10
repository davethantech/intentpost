const router=require("express").Router(),engine=require("../services/aiDecisionEngine"),{requireAuth}=require("../middleware/auth");
router.get("/evaluate",requireAuth,async(req,res)=>{try{res.json(await engine.evaluate({org:req.user.organization_id,accountId:req.query.accountId,contactId:req.query.contactId,cost:Number(req.query.cost||12),campaignId:req.query.campaignId}))}catch(e){res.status(400).json({error:e.message})}});
router.post("/evaluate",requireAuth,async(req,res)=>{try{res.json(await engine.evaluate({org:req.user.organization_id,...req.body,cost:Number(req.body.cost||12)}))}catch(e){res.status(400).json({error:e.message})}});
module.exports=router;
