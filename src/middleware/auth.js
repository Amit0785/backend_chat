const jwt = require("jsonwebtoken");
const User = require("../models/User");
async function auth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token)
      return res.status(401).json({ message: "Authentication required" });
    const p = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(p.id);
    if (!user) return res.status(401).json({ message: "Invalid token" });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid token" });
  }
}
module.exports = auth;
