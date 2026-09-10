require("dotenv").config();
const express=require("express"),cors=require("cors"),cookie=require("cookie-parser"),helmet=require("helmet"),path=require("path"),db=require("./db");
const {general}=require("./middleware/security");
if(process.env.NODE_ENV==="production"&&(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32))throw new Error("JWT_SECRET must be configured with at least 32 characters in production");
const app=express();app.disable("x-powered-by");app.set("trust proxy",Number(process.env.TRUST_PROXY||1));
const allowedOrigins=(process.env.CORS_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);
app.use(helmet({contentSecurityPolicy:false}));app.use(cors({origin:allowedOrigins.length?allowedOrigins:false,credentials:true,methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"]}));
app.use(express.json({limit:"1mb",strict:true}));app.use(cookie());app.use(general);
app.get("/api/health",(req,res)=>res.json({ok:true,service:"intentpost-api",version:"3.1.0"}));
app.get("/api/ready",async(req,res)=>{try{await db.query("SELECT 1");res.json({ready:true})}catch{res.status(503).json({ready:false})}});
app.use("/api/auth",require("./routes/auth"));app.use("/api/dashboard",require("./routes/dashboard"));app.use("/api/webhooks",require("./routes/webhooks"));app.use("/api/graph",require("./routes/graph"));app.use("/api/ai",require("./routes/ai"));app.use("/api/campaigns",require("./routes/campaigns"));app.use("/api/fulfillment",require("./routes/fulfillment"));app.use("/",require("./routes/attribution"));
app.use(express.static(path.join(__dirname,"public"),{maxAge:"1h",etag:true}));
app.use((req,res)=>res.status(404).json({error:"not_found"}));
app.use((err,req,res,next)=>{console.error(JSON.stringify({event:"request_error",method:req.method,path:req.path,error:err.message}));if(res.headersSent)return next(err);res.status(err.statusCode||500).json({error:process.env.NODE_ENV==="production"?"internal_server_error":err.message})});
async function start(){await db.init();return new Promise(resolve=>{const server=app.listen(Number(process.env.PORT||3000),()=>{console.log(JSON.stringify({event:"api_started",port:Number(process.env.PORT||3000)}));resolve(server)})})}
if(require.main===module){start().catch(error=>{console.error(error);process.exit(1)});const shutdown=async signal=>{console.log(JSON.stringify({event:"shutdown",signal}));await db.close();process.exit(0)};for(const signal of ["SIGTERM","SIGINT"])process.on(signal,()=>shutdown(signal));process.on("unhandledRejection",error=>{console.error(error);process.exit(1)});process.on("uncaughtException",error=>{console.error(error);process.exit(1)})}
module.exports={app,start};
