const requireAuth = require("../middleware//requireAuth");
const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  getUserPrivateKey,
} = require("../controllers/profileController");

const router = express.Router();

// Require auth for all routes
router.use(requireAuth);

// Get profile information
router.get("/", getUserProfile);

// Get private key
router.get("/privatekey", getUserPrivateKey);

// Update profile information
router.put("/", updateUserProfile);

module.exports = router;
