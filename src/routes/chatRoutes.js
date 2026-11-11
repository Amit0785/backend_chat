const router = require("express").Router();
const Chat = require("../models/Chat");
const User = require("../models/User");
const Message = require("../models/Message");
const auth = require("../middleware/auth");
router.use(auth);

router.post("/", async (req, res, next) => {
  try {
    let { participantIds = [], isGroup = false, name } = req.body;
    participantIds = [
      ...new Set([String(req.user._id), ...participantIds.map(String)]),
    ];
    if (participantIds.length < 2)
      return res
        .status(400)
        .json({ message: "At least 2 participants required" });
    if (!isGroup && participantIds.length !== 2)
      return res.status(400).json({ message: "Direct chat requires 2 users" });
    const valid = await User.countDocuments({ _id: { $in: participantIds } });
    if (valid !== participantIds.length)
      return res.status(400).json({ message: "Invalid participant" });
    if (!isGroup) {
      const existing = await Chat.findOne({
        isGroup: false,
        participants: { $all: participantIds },
        $expr: { $eq: [{ $size: "$participants" }, 2] },
      })
        .populate("participants", "name email avatar online lastSeen")
        .populate("lastMessage");
      if (existing) return res.json({ chat: existing });
    }
    const chat = await Chat.create({
      participants: participantIds,
      isGroup,
      name,
      admin: isGroup ? req.user._id : null,
    });
    await chat.populate("participants", "name email avatar online lastSeen");
    res.status(201).json({ chat });
  } catch (e) {
    next(e);
  }
});
router.get("/", async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name email avatar online lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });
    res.json({ chats });
  } catch (e) {
    next(e);
  }
});
router.get("/:chatId", async (req, res, next) => {
  try {
    const c = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id,
    })
      .populate("participants", "name email avatar online lastSeen")
      .populate("lastMessage");
    if (!c) return res.status(404).json({ message: "Chat not found" });
    res.json({ chat: c });
  } catch (e) {
    next(e);
  }
});
router.post("/:chatId/members", async (req, res, next) => {
  try {
    const c = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id,
    });
    if (!c || !c.isGroup)
      return res.status(404).json({ message: "Group not found" });
    if (String(c.admin) !== String(req.user._id))
      return res.status(403).json({ message: "Only admin can add members" });
    if (!(await User.exists({ _id: req.body.userId })))
      return res.status(400).json({ message: "Invalid user" });
    if (!c.participants.some((x) => String(x) === String(req.body.userId)))
      c.participants.push(req.body.userId);
    await c.save();
    await c.populate("participants", "name email avatar online lastSeen");
    res.json({ chat: c });
  } catch (e) {
    next(e);
  }
});
router.delete("/:chatId/members/:userId", async (req, res, next) => {
  try {
    const c = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id,
    });
    if (!c || !c.isGroup)
      return res.status(404).json({ message: "Group not found" });
    if (String(c.admin) !== String(req.user._id))
      return res.status(403).json({ message: "Only admin can remove members" });
    c.participants = c.participants.filter(
      (x) => String(x) !== req.params.userId,
    );
    await c.save();
    res.json({ message: "Member removed" });
  } catch (e) {
    next(e);
  }
});
module.exports = router;
