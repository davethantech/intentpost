const router=require("express").Router(),attr=require("../services/qrAttribution");
router.get("/r/:code",async(req,res)=>{try{const out=await attr.record(req.params.code,req);if(!out)return res.status(404).send("Unknown tracking code");res.redirect(process.env.ATTRIBUTION_REDIRECT_URL||"/")}catch(e){res.status(500).send("Attribution error")}});
module.exports=router;
