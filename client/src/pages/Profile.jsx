import { useEffect } from "react";
import { Link } from "react-router-dom";
import { UserProfile } from "@clerk/clerk-react";
import {
  CreditCard, Zap, CheckCircle, ArrowUpCircle,
  BarChart2, Clock, ChevronRight,
} from "lucide-react";
import { useSubscription } from "../hooks/useSubscription";
import { getPlanBadgeClass } from "../utils/formatters";

export default function Profile() {
  const { subscription, fetchSubscription, upgrade, downgrade, upgrading } = useSubscription();

  useEffect(() => { fetchSubscription(); }, []);

  const plan        = subscription?.plan || "free";
  const usage       = subscription?.usage;
  const pct         = usage && !usage.isUnlimited
    ? Math.min(100, Math.round((usage.used / usage.total) * 100))
    : null;

  return (
    <div className="section py-8 space-y-10 max-w-4xl mx-auto">

      {/* Page title */}
      <div>
        <h1 className="page-title">Profile & Settings</h1>
        <p className="page-sub">Manage your account and billing</p>
      </div>

      {/* ── Billing / Subscription section ──────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-indigo-400" />
          Billing & Plan
        </h2>

        <div className="card space-y-6">

          {/* Current plan + usage */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={
                "h-12 w-12 rounded-xl flex items-center justify-center text-xl " +
                (plan === "enterprise" ? "bg-purple-900/40" : plan === "pro" ? "bg-indigo-900/40" : "bg-gray-800")
              }>
                {plan === "enterprise" ? "🚀" : plan === "pro" ? "⚡" : "🆓"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white capitalize">{plan} Plan</span>
                  <span className={getPlanBadgeClass(plan)}>{plan}</span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">
                  {plan === "free"       && "10 image predictions / month"}
                  {plan === "pro"        && "200 predictions / month · Video included"}
                  {plan === "enterprise" && "Unlimited predictions · Full video support"}
                </p>
              </div>
            </div>

            {/* Quick action button */}
            {plan === "free" && (
              <Link to="/pricing" className="btn-primary btn-sm flex items-center gap-1.5 shrink-0">
                <Zap className="h-3.5 w-3.5" /> Upgrade plan
              </Link>
            )}
            {plan !== "free" && (
              <Link to="/pricing" className="btn-secondary btn-sm flex items-center gap-1.5 shrink-0">
                Manage plan <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {/* Usage bar */}
          {usage && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" /> Predictions this month
                </span>
                <span className="text-white font-medium font-mono">
                  {usage.used}
                  {!usage.isUnlimited && <span className="text-gray-500"> / {usage.total}</span>}
                  {usage.isUnlimited && <span className="text-gray-500"> / ∞</span>}
                </span>
              </div>
              {!usage.isUnlimited && (
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={
                      "h-full rounded-full transition-all duration-500 " +
                      (pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-orange-500" : "bg-indigo-500")
                    }
                    style={{ width: pct + "%" }}
                  />
                </div>
              )}
              {usage.isUnlimited && (
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                </div>
              )}
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Resets {usage.resetAt ? new Date(usage.resetAt).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "—"}
              </p>
            </div>
          )}

          {/* Feature list for current plan */}
          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Included in your plan
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {getPlanFeatures(plan).map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade prompt for free users */}
          {plan === "free" && (
            <div className="border border-indigo-800/50 rounded-xl p-4 bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <ArrowUpCircle className="h-4 w-4 text-indigo-400" />
                  Unlock more with Pro
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Get 200 predictions, video analysis, and 50 MB uploads for $9/month.
                </p>
              </div>
              <Link to="/pricing" className="btn-primary btn-sm shrink-0">
                See all plans
              </Link>
            </div>
          )}

          {/* Downgrade option for paid users */}
          {plan !== "free" && (
            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500 mb-2">Need to change your plan?</p>
              <div className="flex gap-3">
                <Link to="/pricing" className="btn-secondary btn-sm">
                  Switch plan
                </Link>
                <button
                  onClick={downgrade}
                  disabled={upgrading}
                  className="btn btn-ghost btn-sm text-gray-500 hover:text-red-400 text-xs"
                >
                  Downgrade to Free
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Clerk profile manager ────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white">Account Details</h2>
        <p className="text-sm text-gray-500">
          Update your name, email, password, and connected accounts below.
        </p>
        <UserProfile
          routing="hash"
          appearance={{
            variables: {
              colorPrimary:         "#4f46e5",
              colorBackground:      "#111827",
              colorInputBackground: "#030712",
              colorInputText:       "#f9fafb",
              colorText:            "#e5e7eb",
              borderRadius:         "8px",
            },
            elements: {
              card:          "bg-gray-900 border border-gray-800 shadow-none",
              navbar:        "border-r border-gray-800 bg-gray-900",
              navbarButton:  "text-gray-300 hover:bg-gray-800",
              pageScrollBox: "bg-gray-900",
            },
          }}
        />
      </section>
    </div>
  );
}

// Features shown per plan in the billing section
function getPlanFeatures(plan) {
  const features = {
    free: [
      "10 image predictions / month",
      "Full prediction history",
      "Download annotated images",
      "MediaPipe face detection",
    ],
    pro: [
      "200 predictions / month",
      "Video analysis (2 min max)",
      "50 MB file uploads",
      "Emotion timeline charts",
      "Priority support",
    ],
    enterprise: [
      "Unlimited predictions",
      "Video analysis (10 min max)",
      "200 MB file uploads",
      "Full analytics dashboard",
      "Dedicated support",
    ],
  };
  return features[plan] || features.free;
}