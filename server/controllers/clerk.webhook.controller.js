const { Webhook } = require("svix");
const User = require("../models/User.model");

/**
 * Clerk Webhook Controller
 *
 * Handles user lifecycle + billing events from Clerk.
 * Supports both:
 *   - Manual plan via publicMetadata.plan
 *   - Clerk Billing subscription events
 */
const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: "CLERK_WEBHOOK_SECRET not set" });
  }

  const svix_id        = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing svix headers" });
  }

  let event;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(req.body, {
      "svix-id":        svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const { type, data } = event;
  console.log("Clerk webhook →", type);

  try {
    switch (type) {

      // ── User created ───────────────────────────────────────
      case "user.created": {
        const email = getPrimaryEmail(data);
        const name  = getFullName(data) || email.split("@")[0];
        const plan  = data.public_metadata?.plan || "free";

        await User.create({
          clerkId: data.id,
          email,
          name,
          avatar: data.image_url || "",
          plan,
        });
        console.log("✅ User created:", email);
        break;
      }

      // ── User updated (profile or metadata change) ──────────
      case "user.updated": {
        const email  = getPrimaryEmail(data);
        const name   = getFullName(data);
        // Read plan from publicMetadata (set by your server or Clerk billing)
        const plan   = data.public_metadata?.plan;

        const update = { email, avatar: data.image_url || "" };
        if (name) update.name = name;
        if (plan) update.plan = plan;

        await User.findOneAndUpdate({ clerkId: data.id }, update, { new: true });
        console.log("✅ User updated:", email, plan ? "→ plan: " + plan : "");
        break;
      }

      // ── Clerk Billing: subscription created or updated ─────
      case "user.subscription.created":
      case "user.subscription.updated": {
        const clerkId  = data.user_id || data.clerkId;
        const planSlug = data.plan?.slug || data.subscription?.plan?.slug;

        if (clerkId && planSlug) {
          // Map Clerk plan slug to your plan names
          const plan = mapClerkPlanToPlan(planSlug);
          await User.findOneAndUpdate({ clerkId }, { plan });
          console.log("✅ Subscription updated:", clerkId, "→", plan);
        }
        break;
      }

      // ── Clerk Billing: subscription deleted/canceled ───────
      case "user.subscription.deleted": {
        const clerkId = data.user_id || data.clerkId;
        if (clerkId) {
          await User.findOneAndUpdate({ clerkId }, { plan: "free" });
          console.log("✅ Subscription canceled:", clerkId, "→ free");
        }
        break;
      }

      // ── User deleted ───────────────────────────────────────
      case "user.deleted": {
        const user = await User.findOne({ clerkId: data.id });
        if (user) {
          const Prediction    = require("../models/Prediction.model");
          const cloudinarySvc = require("../services/cloudinary.service");

          const predictions = await Prediction.find({ clerkId: data.id });
          for (const p of predictions) {
            const rt = p.type === "video" ? "video" : "image";
            if (p.originalPublicId)  await cloudinarySvc.deleteFile(p.originalPublicId, rt).catch(() => {});
            if (p.annotatedPublicId) await cloudinarySvc.deleteFile(p.annotatedPublicId, rt).catch(() => {});
          }
          await Prediction.deleteMany({ clerkId: data.id });
          await user.deleteOne();
          console.log("✅ User deleted:", data.id);
        }
        break;
      }

      default:
        console.log("Unhandled Clerk event:", type);
    }
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }

  return res.json({ received: true, type });
};

// ── Helpers ────────────────────────────────────────────────────
const getPrimaryEmail = (data) => {
  const primary = data.email_addresses?.find(
    (e) => e.id === data.primary_email_address_id
  );
  return primary?.email_address || "";
};

const getFullName = (data) =>
  [data.first_name, data.last_name].filter(Boolean).join(" ");

// Map Clerk plan slug → your plan name
// Update these slugs to match exactly what you named plans in Clerk Dashboard
const mapClerkPlanToPlan = (slug) => {
  const map = {
    "pro":        "pro",
    "pro-plan":   "pro",
    "enterprise": "enterprise",
    "enterprise-plan": "enterprise",
    "free":       "free",
  };
  return map[slug?.toLowerCase()] || "free";
};

module.exports = { handleClerkWebhook };