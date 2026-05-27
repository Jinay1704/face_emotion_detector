const mongoose = require("mongoose");

/**
 * User model — simplified because Clerk handles all auth.
 * We only store app-specific data here (plan, usage, stripe IDs).
 * clerkId is the primary identifier — synced via Clerk webhook.
 */
const UserSchema = new mongoose.Schema(
  {
    // ── Clerk identity ─────────────────────────────────────────
    clerkId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    email: {
      type:     String,
      required: true,
      unique:   true,
      lowercase: true,
    },
    name:   { type: String, default: "" },
    avatar: { type: String, default: "" },

    // ── Subscription ───────────────────────────────────────────
    plan: {
      type:    String,
      enum:    ["free", "pro", "enterprise"],
      default: "free",
    },
    stripeCustomerId:     { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    subscriptionStatus: {
      type:    String,
      enum:    ["active", "canceled", "past_due", "trialing", null],
      default: null,
    },
    subscriptionEndsAt: { type: Date, default: null },

    // ── Usage tracking ─────────────────────────────────────────
    predictionsThisMonth: { type: Number, default: 0 },
    usageResetAt: {
      type:    Date,
      default: () => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1, 1);
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },
  },
  { timestamps: true }
);

// ── Reset monthly usage if new month ──────────────────────────
UserSchema.methods.checkAndResetUsage = async function () {
  if (new Date() >= this.usageResetAt) {
    this.predictionsThisMonth = 0;
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 1);
    d.setHours(0, 0, 0, 0);
    this.usageResetAt = d;
    await this.save();
  }
};

module.exports = mongoose.model("User", UserSchema);