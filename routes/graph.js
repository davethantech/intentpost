const router=require("express").Router(),{requireAuth}=require("../middleware/auth"),{accountGraph}=require("../services/intentGraph");
router.get("/account/:id",requireAuth,async(req,res)=>{try{res.json(await accountGraph(req.params.id,req.user.organization_id))}catch(e){res.status(400).json({error:e.message})}});
module.exports=router;
