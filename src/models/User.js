const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: "" },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
  },
  { timestamps: true },
);
module.exports = mongoose.model("User", schema);
