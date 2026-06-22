const { clerkMiddleware, getAuth } = require("@clerk/express");
const User = require("../models/User.model");
const { sendError } = require("../utils/response.utils");
/**
 * clerkAuth — verifies the Clerk session token from the
 * Authorization: Bearer <token> header automatically.
 * Attach this to any route that needs authentication.
 */
const clerkAuth = clerkMiddleware();
/**
 * attachUser — after clerkAuth, load the matching MongoDB user
 * and attach it to req.user. Creates the user if first login
 * (in case the webhook hasn't fired yet).
 */
const attachUser = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return sendError(res, 401, "Not authenticated — please sign in");
    }
    let user = await User.findOne({ clerkId: userId });
    // Auto-create user doc if webhook hasn't synced yet
    if (!user) {
      user = await User.create({ clerkId: userId, email: "pending@clerk.dev", name: "" });
    }
    await user.checkAndResetUsage();
    req.user   = user;
    req.clerkId = userId;
    next();
  } catch (err) {
    return sendError(res, 401, "Auth error: " + err.message);
  }
};
/**
 * protect — combines both middlewares. Use on any protected route:
 *   router.get("/me", ...protect, controller)
 */
const protect = [clerkAuth, attachUser];
module.exports = { clerkAuth, attachUser, protect };