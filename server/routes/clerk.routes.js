const express = require("express");
const router  = express.Router();
const { handleClerkWebhook } = require("../controllers/clerk.webhook.controller");

// POST /api/clerk/webhook
// Raw body needed for svix signature verification
router.post("/webhook", express.raw({ type: "application/json" }), handleClerkWebhook);

module.exports = router;
