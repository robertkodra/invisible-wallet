const requireAuth = require("../middleware//requireAuth");
const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  getArgentPrivateKey,
  getBraavosPrivateKey,
} = require("../controllers/profileController");

const router = express.Router();

// Require auth for all routes
router.use(requireAuth);

// Get profile information
router.get("/", getUserProfile);

// Get private key
router.get("/argent/privatekey", getArgentPrivateKey);
router.get("/braavos/privatekey", getBraavosPrivateKey);

// Update profile information
router.put("/", updateUserProfile);

module.exports = router;
