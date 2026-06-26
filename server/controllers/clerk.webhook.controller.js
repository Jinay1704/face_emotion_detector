const { Webhook } = require("svix");
const User = require("../models/User.model");

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
  console.log("✅ Clerk webhook received:", type);

  try {
    switch (type) {

      case "user.created": {
        const email = getPrimaryEmail(data);
        const name  = getFullName(data) || email.split("@")[0];
        const plan  = data.public_metadata?.plan || "free";
        await User.create({
          clerkId: data.id, email, name,
          avatar: data.image_url || "", plan,
        });
        console.log("✅ User created:", email);
        break;
      }

      case "user.updated": {
        const email  = getPrimaryEmail(data);
        const name   = getFullName(data);
        const plan   = data.public_metadata?.plan;
        const update = { email, avatar: data.image_url || "" };
        if (name) update.name = name;
        if (plan) update.plan = plan;
        await User.findOneAndUpdate({ clerkId: data.id }, update, { new: true });
        console.log("✅ User updated:", email);
        break;
      }

      // ── Handle ALL subscription event name variants ────────
      case "subscription.created":
      case "subscription.updated":
      case "user.subscription.created":
      case "user.subscription.updated": {
        const clerkId = data.payer?.user_id
                     || data.user_id
                     || data.userId;

        if (!clerkId) {
          console.warn("⚠️ No clerkId in subscription event");
          break;
        }

        const items = data.items || [];
        console.log("Items count:", items.length);
        console.log("Items:", items.map(i => `${i.plan?.slug}(${i.status})`).join(", "));

        // ── Find the correct plan using smart priority ─────
        // Order of priority (most specific first):
        const PRIORITY = ["active", "upcoming", "ended", "canceled", "abandoned"];

        let bestPlanSlug = null;
        let bestPlanAmount = -1;

        // From all non-abandoned items, pick the highest paid plan
        // that is active or upcoming
        for (const status of ["active", "upcoming"]) {
          const candidates = items.filter(i => i.status === status);
          for (const item of candidates) {
            const amount = item.plan?.amount ?? 0;
            const slug   = item.plan?.slug;
            if (slug && amount >= bestPlanAmount) {
              bestPlanAmount = amount;
              bestPlanSlug   = slug;
            }
          }
          if (bestPlanSlug && bestPlanAmount > 0) break; // found paid plan
        }

        // If no active/upcoming paid plan found, check if subscription
        // overall is active (just renewed or switched)
        if (!bestPlanSlug || bestPlanAmount === 0) {
          // Sort items by created_at descending → newest first
          const sortedItems = [...items].sort(
            (a, b) => (b.created_at || 0) - (a.created_at || 0)
          );
          // Take the newest non-abandoned, non-canceled item
          const newest = sortedItems.find(
            i => !["abandoned", "canceled"].includes(i.status)
          );
          if (newest) {
            bestPlanSlug   = newest.plan?.slug;
            bestPlanAmount = newest.plan?.amount ?? 0;
          }
        }

        // Final fallback
        if (!bestPlanSlug) bestPlanSlug = "free";

        const plan = mapClerkPlanToPlan(bestPlanSlug);
        console.log("Resolved plan slug:", bestPlanSlug, "→ plan:", plan);

        const user = await User.findOneAndUpdate(
          { clerkId },
          { plan },
          { new: true }
        );

        if (user) {
          console.log("✅ Plan updated in DB:", user.email, "→", plan);
        } else {
          console.warn("⚠️ User not found for clerkId:", clerkId);
        }
        break;
      }

      case "subscription.deleted":
      case "user.subscription.deleted": {
        const clerkId = data.payer?.user_id || data.user_id || data.userId;
        if (clerkId) {
          const user = await User.findOneAndUpdate(
            { clerkId }, { plan: "free" }, { new: true }
          );
          console.log("✅ Subscription deleted → free:", user?.email);
        }
        break;
      }

      case "user.deleted": {
        const user = await User.findOne({ clerkId: data.id });
        if (user) {
          const Prediction    = require("../models/Prediction.model");
          const cloudinarySvc = require("../services/cloudinary.service");
          const predictions   = await Prediction.find({ clerkId: data.id });
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
        console.log("ℹ️ Unhandled event:", type);
    }
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed: " + err.message });
  }

  return res.json({ received: true, type });
};

const getPrimaryEmail = (data) => {
  const primary = data.email_addresses?.find(
    (e) => e.id === data.primary_email_address_id
  );
  return primary?.email_address || "";
};

const getFullName = (data) =>
  [data.first_name, data.last_name].filter(Boolean).join(" ");

const mapClerkPlanToPlan = (slug) => {
  if (!slug) return "free";
  const s = slug.toLowerCase().trim();
  if (s.includes("enterprise")) return "enterprise";
  if (s.includes("pro"))        return "pro";
  return "free";
};

module.exports = { handleClerkWebhook };