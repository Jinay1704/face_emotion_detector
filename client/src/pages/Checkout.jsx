import * as React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { SignedIn, ClerkLoaded } from "@clerk/clerk-react";
import {
  CheckoutProvider,
  useCheckout,
  PaymentElementProvider,
  PaymentElement,
  usePaymentElement,
} from "@clerk/clerk-react/experimental";
import {
  CheckCircle, XCircle, ArrowLeft,
  Loader2, Shield, CreditCard,
} from "lucide-react";

const PLAN_INFO = {
  pro: {
    name: "Pro", price: "$9.00", period: "month",
    planId: import.meta.env.VITE_CLERK_PRO_PLAN_ID,
    features: ["200 predictions/month", "Video analysis (2 min)", "50 MB uploads", "Priority support"],
  },
  enterprise: {
    name: "Enterprise", price: "$29.00", period: "month",
    planId: import.meta.env.VITE_CLERK_ENTERPRISE_PLAN_ID,
    features: ["Unlimited predictions", "Video analysis (10 min)", "200 MB uploads", "Dedicated support"],
  },
};

export default function Checkout() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const upgraded  = params.get("upgraded");
  const planKey   = params.get("plan");
  const plan      = PLAN_INFO[planKey];

  // ── Success ────────────────────────────────────────────────
  if (upgraded) return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center space-y-6 p-10">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-white">Payment successful! 🎉</h2>
          <p className="text-gray-400 mt-2">Your plan has been upgraded. Enjoy your new features!</p>
        </div>
        <Link to="/dashboard" className="btn btn-primary w-full block text-center">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );

  // ── No plan / missing plan ID ──────────────────────────────
  if (!plan || !plan.planId) return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center space-y-4 p-10">
        <XCircle className="h-12 w-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">
          {!plan ? "No plan selected" : "Plan ID not configured"}
        </h2>
        <p className="text-gray-400 text-sm">
          {!plan
            ? "Please select a plan from the pricing page."
            : "Add VITE_CLERK_PRO_PLAN_ID or VITE_CLERK_ENTERPRISE_PLAN_ID to your .env file."}
        </p>
        <Link to="/pricing" className="btn btn-primary w-full block text-center">
          View Plans
        </Link>
      </div>
    </div>
  );

  // ── Checkout ───────────────────────────────────────────────
  return (
    <div className="section py-12 max-w-5xl mx-auto">
      <Link to="/pricing" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to pricing
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-400" /> Order Summary
            </h2>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div>
                <p className="text-white font-semibold">{plan.name} Plan</p>
                <p className="text-xs text-gray-400 mt-0.5">Billed monthly · Cancel anytime</p>
              </div>
              <span className="text-white font-bold">{plan.price}</span>
            </div>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-800 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span><span>{plan.price}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Tax</span><span>$0.00</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-2 border-t border-gray-800">
                <span>Total due today</span>
                <span className="text-indigo-400 text-lg">{plan.price}</span>
              </div>
            </div>
          </div>

          <div className="card p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Secure payment</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Powered by Clerk × Stripe. Your card details are encrypted and never stored.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-6">Payment details</h2>
            <ClerkLoaded>
              <SignedIn>
                <CheckoutProvider
                  for="user"
                  planId={plan.planId}
                  planPeriod="month"
                >
                  <CheckoutFlow planName={plan.name} />
                </CheckoutProvider>
              </SignedIn>
            </ClerkLoaded>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Checkout flow ──────────────────────────────────────────────
function CheckoutFlow({ planName }) {
  const { checkout } = useCheckout();
  const { status }   = checkout;

  if (status === "needs_initialization") {
    return <CheckoutInit />;
  }

  return (
    <PaymentElementProvider checkout={checkout}>
      <PaymentSection planName={planName} />
    </PaymentElementProvider>
  );
}

function CheckoutInit() {
  const { checkout }           = useCheckout();
  const { start, fetchStatus } = checkout;

  return (
    <div className="text-center py-8 space-y-4">
      <p className="text-gray-400 text-sm">
        Click below to load the secure payment form.
      </p>
      <button
        onClick={start}
        disabled={fetchStatus === "fetching"}
        className="btn btn-primary w-full"
      >
        {fetchStatus === "fetching"
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Initializing…</>
          : "Continue to Payment"}
      </button>
    </div>
  );
}

function PaymentSection({ planName }) {
  const navigate                   = useNavigate();
  const { checkout }               = useCheckout();
  const { isConfirming, confirm, finalize, error } = checkout;
  const { isFormReady, submit }    = usePaymentElement();
  const [processing, setProcessing] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormReady || processing) return;
    setProcessing(true);
    try {
      const { data, error: submitErr } = await submit();
      if (submitErr) { setProcessing(false); return; }
      await confirm(data);
      await finalize({ navigate: () => navigate("/checkout?upgraded=true") });
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        fallback={
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-gray-400 text-sm">Loading payment form…</span>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-950/30 border border-red-700/50 px-4 py-3 text-sm text-red-400">
          {error.message}
        </div>
      )}

      <button
        type="submit"
        disabled={!isFormReady || processing || isConfirming}
        className="btn btn-primary w-full"
      >
        {processing || isConfirming
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
          : `Pay & Subscribe to ${planName}`}
      </button>

      <p className="text-xs text-center text-gray-500">
        By subscribing you agree to our{" "}
        <Link to="/terms" className="underline hover:text-gray-300">Terms</Link>{" & "}
        <Link to="/privacy" className="underline hover:text-gray-300">Privacy Policy</Link>.
        Cancel anytime from your profile.
      </p>
    </form>
  );
}