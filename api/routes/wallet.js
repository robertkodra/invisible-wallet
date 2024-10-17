const requireAuth = require("../middleware//requireAuth");
const express = require("express");
const { sponsorTransaction } = require("../controllers/walletController");

const router = express.Router();

// require auth for all routes
router.use(requireAuth);

// create wallet route
router.post("/sponsor", sponsorTransaction);

module.exports = router;
