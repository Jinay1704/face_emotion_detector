const { sendError } = require("../utils/response.utils");

const PLAN_LIMITS = {
  free: {
    monthlyPredictions: 10,
    maxVideoLengthSec:  0,
    maxFileSizeMB:      5,
    allowVideo:         false,
  },
  pro: {
    monthlyPredictions: 200,
    maxVideoLengthSec:  120,
    maxFileSizeMB:      50,
    allowVideo:         true,
  },
  enterprise: {
    monthlyPredictions: -1,
    maxVideoLengthSec:  600,
    maxFileSizeMB:      200,
    allowVideo:         true,
  },
};

const checkPredictionLimit = async (req, res, next) => {
  try {
    const user   = req.user;
    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

    if (
      limits.monthlyPredictions !== -1 &&
      user.predictionsThisMonth >= limits.monthlyPredictions
    ) {
      return sendError(res, 403,
        "Monthly limit reached (" + limits.monthlyPredictions + " on " + user.plan + " plan). Upgrade to continue.",
        { limitReached: true, plan: user.plan, limit: limits.monthlyPredictions }
      );
    }

    req.planLimits = limits;
    next();
  } catch (err) {
    return sendError(res, 500, "Plan check error: " + err.message);
  }
};

const checkVideoAllowed = (req, res, next) => {
  const limits = req.planLimits || PLAN_LIMITS[req.user.plan] || PLAN_LIMITS.free;
  if (!limits.allowVideo) {
    return sendError(res, 403,
      "Video not available on " + req.user.plan + " plan. Upgrade to Pro.",
      { upgradeRequired: true }
    );
  }
  next();
};

module.exports = { checkPredictionLimit, checkVideoAllowed, PLAN_LIMITS };