const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../middleware/auth");
const sign = require("../utils/jwt");

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res
        .status(400)
        .json({ message: "Name, email and password (6+ chars) required" });
    if (await User.findOne({ email }))
      return res.status(409).json({ message: "Email already registered" });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash });
    res
      .status(201)
      .json({
        token: sign(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      });
  } catch (e) {
    next(e);
  }
});
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid email or password" });
    user.online = true;
    await user.save();
    res.json({
      token: sign(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (e) {
    next(e);
  }
});
router.get("/me", auth, (req, res) => res.json({ user: req.user }));
module.exports = router;
