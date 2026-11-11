const router=require("express").Router();
const auth=require("../middleware/auth");
const Chat=require("../models/Chat");
const Message=require("../models/Message");
router.use(auth);

async function member(chatId,userId){return Chat.findOne({_id:chatId,participants:userId});}

router.get("/chats/:chatId/messages",async(req,res,next)=>{
 try{
  if(!await member(req.params.chatId,req.user._id))return res.status(403).json({message:"Not a chat member"});
  const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(100,Math.max(1,Number(req.query.limit)||30));
  const messages=await Message.find({chat:req.params.chatId}).populate("sender","name email avatar").sort({createdAt:-1}).skip((page-1)*limit).limit(limit);
  res.json({messages:messages.reverse(),page,limit});
 }catch(e){next(e)}
});
router.post("/chats/:chatId/messages",async(req,res,next)=>{
 try{
  if(!await member(req.params.chatId,req.user._id))return res.status(403).json({message:"Not a chat member"});
  if(!req.body.text?.trim())return res.status(400).json({message:"Message text required"});
  const m=await Message.create({chat:req.params.chatId,sender:req.user._id,text:req.body.text.trim(),readBy:[req.user._id]});
  await Chat.findByIdAndUpdate(req.params.chatId,{lastMessage:m._id});
  await m.populate("sender","name email avatar");
  res.status(201).json({message:m});
 }catch(e){next(e)}
});
router.put("/messages/:messageId",async(req,res,next)=>{
 try{
  const m=await Message.findById(req.params.messageId);
  if(!m)return res.status(404).json({message:"Message not found"});
  if(String(m.sender)!==String(req.user._id))return res.status(403).json({message:"Only sender can edit"});
  m.text=(req.body.text||"").trim();m.edited=true;await m.save();res.json({message:m});
 }catch(e){next(e)}
});
router.delete("/messages/:messageId",async(req,res,next)=>{
 try{
  const m=await Message.findById(req.params.messageId);
  if(!m)return res.status(404).json({message:"Message not found"});
  if(String(m.sender)!==String(req.user._id))return res.status(403).json({message:"Only sender can delete"});
  m.text="";m.deleted=true;await m.save();res.json({message:m});
 }catch(e){next(e)}
});
module.exports=router;