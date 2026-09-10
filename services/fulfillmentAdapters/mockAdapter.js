const crypto=require("crypto");
module.exports={async send(order){return {id:"mock_"+crypto.randomUUID(),status:"queued",provider:"mock"}},async status(){return {status:"delivered"}}};
