const jwt=require("jsonwebtoken");
const User=require("../models/User");
async function socketAuth(socket,next){
  try{
    const token=socket.handshake.auth?.token;
    if(!token) return next(new Error("Authentication required"));
    const p=jwt.verify(token,process.env.JWT_SECRET);
    const user=await User.findById(p.id);
    if(!user) return next(new Error("Invalid token"));
    socket.user=user;
    next();
  }catch(e){next(new Error("Invalid token"))}
}
module.exports={socketAuth};