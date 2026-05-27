const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  getPlans,
  getMySubscription,
  upgradePlan,
  downgradePlan,
} = require("../controllers/subscription.controller");

// Public — anyone can view plans
router.get("/plans", getPlans);

// Protected — must be logged in
router.get("/me",         protect, getMySubscription);
router.post("/upgrade",   protect, upgradePlan);
router.post("/downgrade", protect, downgradePlan);

module.exports = router;
