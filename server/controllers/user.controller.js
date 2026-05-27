const User       = require("../models/User.model");
const Prediction = require("../models/Prediction.model");
const cloudSvc   = require("../services/cloudinary.service");
const { sendSuccess, sendError } = require("../utils/response.utils");
const { PLAN_LIMITS } = require("../middleware/plan.middleware");

// GET /api/user/me
const getMe = async (req, res) => {
  try {
    const user = req.user;
    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
    return sendSuccess(res, 200, "Profile fetched", {
      user: {
        id:                   user._id,
        clerkId:              user.clerkId,
        name:                 user.name,
        email:                user.email,
        avatar:               user.avatar,
        plan:                 user.plan,
        subscriptionStatus:   user.subscriptionStatus,
        subscriptionEndsAt:   user.subscriptionEndsAt,
        predictionsThisMonth: user.predictionsThisMonth,
        usageResetAt:         user.usageResetAt,
        limits,
      },
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /api/user/me  — deletes account + all cloudinary files
const deleteMe = async (req, res) => {
  try {
    const user = req.user;
    const predictions = await Prediction.find({ clerkId: user.clerkId });

    for (const p of predictions) {
      const rt = p.type === "video" ? "video" : "image";
      if (p.originalPublicId)  await cloudSvc.deleteFile(p.originalPublicId, rt).catch(() => {});
      if (p.annotatedPublicId) await cloudSvc.deleteFile(p.annotatedPublicId, rt).catch(() => {});
    }

    await Prediction.deleteMany({ clerkId: user.clerkId });
    await user.deleteOne();

    return sendSuccess(res, 200, "Account and all data deleted");
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { getMe, deleteMe };