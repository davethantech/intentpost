const rateLimit=require("express-rate-limit");
const helmetLike=(req,res,next)=>{res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("X-Frame-Options","DENY");res.setHeader("Referrer-Policy","no-referrer");next()};
const general=rateLimit({windowMs:60*1000,max:240,standardHeaders:true,legacyHeaders:false});
const auth=rateLimit({windowMs:15*60*1000,max:50,standardHeaders:true,legacyHeaders:false});
module.exports={helmetLike,general,auth};
