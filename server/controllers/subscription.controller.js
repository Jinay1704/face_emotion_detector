const { createClerkClient } = require("@clerk/express");
const User = require("../models/User.model");
const { PLAN_LIMITS } = require("../middleware/plan.middleware");
const { sendSuccess, sendError } = require("../utils/response.utils");

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const PLANS = [
  {
    id: "free", name: "Free", price: 0,
    description: "Perfect for trying out EmotionAI",
    features: ["10 image predictions/month", "Full prediction history", "Download annotated results", "MediaPipe face detection"],
  },
  {
    id: "pro", name: "Pro", price: 9, popular: true,
    description: "For individuals and small teams",
    features: ["200 predictions/month", "Video analysis (2 min max)", "50 MB file uploads", "Emotion timeline charts", "Priority support"],
  },
  {
    id: "enterprise", name: "Enterprise", price: 29,
    description: "For teams that need full power",
    features: ["Unlimited predictions", "Video analysis (10 min max)", "200 MB file uploads", "Full analytics dashboard", "Dedicated support"],
  },
];

// GET /api/subscription/plans
const getPlans = (req, res) =>
  sendSuccess(res, 200, "Plans fetched", { plans: PLANS });

// GET /api/subscription/me
const getMySubscription = async (req, res) => {
  try {
    const user        = req.user;
    const limits      = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
    const isUnlimited = limits.monthlyPredictions === -1;
    return sendSuccess(res, 200, "Subscription fetched", {
      plan: user.plan,
      limits,
      usage: {
        used:      user.predictionsThisMonth,
        total:     isUnlimited ? null : limits.monthlyPredictions,
        remaining: isUnlimited ? null : Math.max(0, limits.monthlyPredictions - user.predictionsThisMonth),
        isUnlimited,
        resetAt:   user.usageResetAt,
      },
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * POST /api/subscription/upgrade
 * Called ONLY after Clerk billing confirms payment via webhook.
 * This is also used as fallback for manual plan updates.
 */
const upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const user     = req.user;

    if (!["free", "pro", "enterprise"].includes(plan)) {
      return sendError(res, 400, "Invalid plan");
    }
    if (user.plan === plan) {
      return sendError(res, 400, "Already on " + plan + " plan");
    }

    // Update Clerk publicMetadata
    await clerkClient.users.updateUser(user.clerkId, {
      publicMetadata: { plan, planUpdatedAt: new Date().toISOString() },
    });

    // Update MongoDB directly
    user.plan = plan;
    await user.save();

    console.log("✅ Plan upgraded:", user.email, "→", plan);

    return sendSuccess(res, 200, "Plan upgraded to " + plan, {
      plan,
      limits:          PLAN_LIMITS[plan] || PLAN_LIMITS.free,
      requiresPayment: false,
    });
  } catch (err) {
    console.error("❌ Upgrade error:", err);
    return sendError(res, 500, "Could not upgrade: " + err.message);
  }
};

// POST /api/subscription/downgrade
const downgradePlan = async (req, res) => {
  try {
    const user = req.user;
    if (user.plan === "free") {
      return sendError(res, 400, "Already on free plan");
    }
    await clerkClient.users.updateUser(user.clerkId, {
      publicMetadata: { plan: "free", planUpdatedAt: new Date().toISOString() },
    });
    user.plan = "free";
    await user.save();
    return sendSuccess(res, 200, "Downgraded to free plan", {
      plan: "free", limits: PLAN_LIMITS.free,
    });
  } catch (err) {
    return sendError(res, 500, "Could not downgrade: " + err.message);
  }
};

module.exports = { getPlans, getMySubscription, upgradePlan, downgradePlan };