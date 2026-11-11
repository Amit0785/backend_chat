const router=require("express").Router();
const User=require("../models/User");
const auth=require("../middleware/auth");
router.use(auth);
router.get("/",async(req,res,next)=>{
 try{
  const q=(req.query.search||"").trim();
  const filter=q?{$or:[{name:{$regex:q,$options:"i"}},{email:{$regex:q,$options:"i"}}]}:{};
  const users=await User.find(filter).select("name email avatar online lastSeen").limit(30);
  res.json({users});
 }catch(e){next(e)}
});
router.get("/:id",async(req,res,next)=>{
 try{
  const u=await User.findById(req.params.id).select("name email avatar online lastSeen");
  if(!u)return res.status(404).json({message:"User not found"}); res.json({user:u});
 }catch(e){next(e)}
});
module.exports=router;