const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 100 },
    isGroup: { type: Boolean, default: false },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Chat", schema);
