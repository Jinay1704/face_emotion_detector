import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Check, Zap, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

export default function Pricing() {
  const { isSignedIn }  = useUser();
  const { getToken }    = useAuth();
  const navigate        = useNavigate();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [downgrading, setDowngrading] = useState(false);

  // Fetch current plan directly
  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const res   = await axios.get(BASE_URL + "/subscription/me", {
          headers: { Authorization: "Bearer " + token },
        });
        setCurrentPlan(res.data.data.plan || "free");
      } catch (_) {}
    })();
  }, [isSignedIn]);

  // Upgrade → go to checkout page
  const handleUpgrade = (planId) => {
    if (!isSignedIn) { navigate("/sign-in"); return; }
    navigate("/checkout?plan=" + planId);
  };

  // Downgrade → direct API call
  const handleDowngrade = async () => {
    setDowngrading(true);
    try {
      const token = await getToken();
      await axios.post(BASE_URL + "/subscription/downgrade", {}, {
        headers: { Authorization: "Bearer " + token },
      });
      setCurrentPlan("free");
      toast.success("Downgraded to Free plan");
    } catch (err) {
      toast.error(err.response?.data?.message || "Downgrade failed");
    } finally {
      setDowngrading(false);
    }
  };

  return (
    <div className="section py-16 space-y-14">

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white mb-4">Simple, transparent pricing</h1>
        <p className="text-gray-400 text-lg">Upgrade or downgrade anytime — your plan updates instantly.</p>
        {!isSignedIn && (
          <p className="mt-4 text-sm text-indigo-400">
            <Link to="/sign-up" className="underline font-medium">Create a free account</Link>{" "}
            to get started instantly.
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isHigher  = getPlanRank(plan.id) > getPlanRank(currentPlan);
          const isLower   = getPlanRank(plan.id) < getPlanRank(currentPlan);

          return (
            <div key={plan.id} className={
              "relative flex flex-col rounded-2xl border p-8 transition-all " +
              (plan.popular
                ? "border-indigo-500 bg-indigo-950/20 shadow-xl shadow-indigo-500/10"
                : isCurrent
                ? "border-green-600/50 bg-green-950/10"
                : "border-gray-800 bg-gray-900 hover:border-gray-600")
            }>
              {/* Badges */}
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow">
                    <Zap className="h-3 w-3" /> Most popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-600 text-white text-xs font-semibold shadow">
                    ✓ Current plan
                  </span>
                </div>
              )}

              {/* Plan info */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {!isSignedIn ? (
                <Link to="/sign-up" className={"btn w-full " + (plan.popular ? "btn-primary" : "btn-secondary")}>
                  Get started free
                </Link>
              ) : isCurrent ? (
                <div className="text-center py-2.5 rounded-lg border border-green-700/50 text-green-400 text-sm font-medium bg-green-900/10">
                  ✓ Active plan
                </div>
              ) : isHigher ? (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={"btn w-full " + (plan.popular ? "btn-primary" : "btn-secondary")}
                >
                  Upgrade to {plan.name}
                </button>
              ) : isLower && plan.id === "free" ? (
                <button
                  onClick={handleDowngrade}
                  disabled={downgrading}
                  className="btn btn-ghost w-full text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-700/50 text-sm"
                >
                  {downgrading
                    ? <><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Downgrading…</>
                    : "Downgrade to Free"}
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className="btn btn-secondary w-full"
                >
                  Switch to {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Common questions</h2>
        <div className="space-y-4">
          {[
            { q: "When does my plan change?",     a: "Instantly after checkout is complete." },
            { q: "Can I downgrade back to Free?", a: "Yes, at any time. Your history is always preserved." },
            { q: "Does Free plan expire?",         a: "Never. Free plan is permanent with 10 predictions every month." },
            { q: "Is payment secure?",             a: "Yes — payments are processed securely. Your card details are encrypted." },
          ].map((item) => (
            <div key={item.q} className="card">
              <p className="text-white font-semibold mb-2">{item.q}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getPlanRank(plan) {
  return { free: 0, pro: 1, enterprise: 2 }[plan] ?? 0;
}