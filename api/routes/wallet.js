const express = require("express");
const requireAuth = require("../middleware//requireAuth");
const { sponsorTransaction } = require("../controllers/walletController");

const router = express.Router();

// Require auth for all routes
router.use(requireAuth);

// Sponsor a transaction
router.post("/sponsor", sponsorTransaction);

module.exports = router;
