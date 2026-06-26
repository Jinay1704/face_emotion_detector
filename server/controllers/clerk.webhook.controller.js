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

      // ── User updated ───────────────────────────────────────
      case "user.updated": {
        const email = getPrimaryEmail(data);
        const name  = getFullName(data);
        const plan  = data.public_metadata?.plan;
        const update = { email, avatar: data.image_url || "" };
        if (name) update.name = name;
        if (plan) update.plan = plan;
        await User.findOneAndUpdate({ clerkId: data.id }, update, { new: true });
        console.log("✅ User updated:", email, plan ? "→ plan: " + plan : "");
        break;
      }

      // ── Subscription created or updated ───────────────────
      case "subscription.created":
      case "subscription.updated":
      case "user.subscription.created":
      case "user.subscription.updated": {
        console.log("💳 Subscription event:", type);

        // ── Get the user ID from payer ─────────────────────
        const clerkId = data.payer?.user_id
                     || data.user_id
                     || data.userId;

        if (!clerkId) {
          console.warn("⚠️ No clerkId found in subscription event");
          break;
        }

        // ── Find active plan from items array ──────────────
        // Items array contains all subscription items
        // Status priority: active > upcoming > (ignore abandoned/canceled/ended)
        const items = data.items || [];

        console.log("All items:", items.map(i => ({
          plan: i.plan?.slug,
          status: i.status,
          amount: i.plan?.amount
        })));

        // Find the best active plan
        // Priority: active paid > upcoming paid > active free > upcoming free
        let activePlanSlug = null;

        // First try: find active paid plan
        const activePaid = items.find(
          i => i.status === "active" && i.plan?.amount > 0
        );
        if (activePaid) {
          activePlanSlug = activePaid.plan.slug;
          console.log("Found active paid plan:", activePlanSlug);
        }

        // Second try: find upcoming paid plan (switching to)
        if (!activePlanSlug) {
          const upcomingPaid = items.find(
            i => i.status === "upcoming" && i.plan?.amount > 0
          );
          if (upcomingPaid) {
            activePlanSlug = upcomingPaid.plan.slug;
            console.log("Found upcoming paid plan:", activePlanSlug);
          }
        }

        // Third try: find active free plan (downgraded)
        if (!activePlanSlug) {
          const activeFree = items.find(
            i => (i.status === "active" || i.status === "upcoming") && i.plan?.amount === 0
          );
          if (activeFree) {
            activePlanSlug = activeFree.plan.slug || "free";
            console.log("Found active/upcoming free plan:", activePlanSlug);
          }
        }

        // Default to free if nothing found
        if (!activePlanSlug) {
          activePlanSlug = "free";
          console.log("No active plan found, defaulting to free");
        }

        const plan = mapClerkPlanToPlan(activePlanSlug);
        console.log("Mapped plan slug:", activePlanSlug, "→", plan);

        const user = await User.findOneAndUpdate(
          { clerkId },
          { plan },
          { new: true }
        );

        if (user) {
          console.log("✅ Plan updated:", user.email, "→", plan);
        } else {
          console.warn("⚠️ User not found in MongoDB for clerkId:", clerkId);
        }
        break;
      }

      // ── Subscription deleted ───────────────────────────────
      case "subscription.deleted":
      case "user.subscription.deleted": {
        const clerkId = data.payer?.user_id || data.user_id || data.userId;
        if (clerkId) {
          const user = await User.findOneAndUpdate(
            { clerkId },
            { plan: "free" },
            { new: true }
          );
          console.log("✅ Subscription deleted → free | User:", user?.email);
        }
        break;
      }

      // ── User deleted ───────────────────────────────────────
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
        console.log("ℹ️ Unhandled Clerk event:", type);
    }
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
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