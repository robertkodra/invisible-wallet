const requireAuth = require("../middleware//requireAuth");
const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  getUserPrivateKey,
} = require("../controllers/profileController");

const router = express.Router();

// require auth for all routes
router.use(requireAuth);

// get profile
router.get("/user", getUserProfile);

router.get("/privatekey", getUserPrivateKey);

router.post("/update", updateUserProfile);

module.exports = router;
