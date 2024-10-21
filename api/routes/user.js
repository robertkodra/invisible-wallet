const express = require("express");
const { authLimiter } = require("../middleware/rateLimiter");
const { loginUser, signupUser } = require("../controllers/userController");

const router = express.Router();

router.post("/login", authLimiter, loginUser);
router.post("/signup", authLimiter, signupUser);

module.exports = router;
