import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, ArrowLeft, Loader2, Shield, CreditCard, Lock } from "lucide-react";
import { useSubscription } from "../hooks/useSubscription";
import toast from "react-hot-toast";

const PLAN_INFO = {
  pro:        { name: "Pro",        price: "$9.00",  features: ["200 predictions/month", "Video analysis", "50 MB uploads", "Priority support"] },
  enterprise: { name: "Enterprise", price: "$29.00", features: ["Unlimited predictions", "Video analysis 10min", "200 MB uploads", "Dedicated support"] },
};

export default function Checkout() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const upgraded  = params.get("upgraded");
  const planKey   = params.get("plan");
  const plan      = PLAN_INFO[planKey];

  const { upgrade, upgrading } = useSubscription();

  const [form, setForm] = useState({
    name:   "",
    number: "",
    expiry: "",
    cvc:    "",
    email:  "",
  });
  const [errors, setErrors] = useState({});

  // ── Success screen ─────────────────────────────────────────
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

  // ── No valid plan ──────────────────────────────────────────
  if (!plan) return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center space-y-4 p-10">
        <XCircle className="h-12 w-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">No plan selected</h2>
        <Link to="/pricing" className="btn btn-primary w-full block text-center">View plans</Link>
      </div>
    </div>
  );

  // ── Format card number with spaces ────────────────────────
  const formatCardNumber = (val) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    return clean.length >= 3 ? clean.slice(0, 2) + "/" + clean.slice(2) : clean;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "number") value = formatCardNumber(value);
    if (name === "expiry") value = formatExpiry(value);
    if (name === "cvc")    value = value.replace(/\D/g, "").slice(0, 4);
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.email.includes("@"))          e.email  = "Enter a valid email";
    if (!form.name.trim())                  e.name   = "Name is required";
    if (form.number.replace(/\s/g,"").length < 13) e.number = "Enter a valid card number";
    if (form.expiry.length < 5)             e.expiry = "Enter expiry as MM/YY";
    if (form.cvc.length < 3)               e.cvc    = "Enter a valid CVC";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Simulate processing delay then upgrade
    await new Promise((r) => setTimeout(r, 1500));
    const ok = await upgrade(planKey);
    if (ok) navigate("/checkout?upgraded=true");
  };

  // ── Checkout form ──────────────────────────────────────────
  return (
    <div className="section py-12 max-w-5xl mx-auto">

      <Link to="/pricing" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to pricing
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Left: Order summary ── */}
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
              <p className="text-xs text-gray-400 mt-0.5">256-bit SSL encryption. Your card details are never stored.</p>
            </div>
          </div>
        </div>

        {/* ── Right: Payment form ── */}
        <div className="lg:col-span-3">
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-400" /> Payment details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" type="email"
                  className={"input w-full " + (errors.email ? "border-red-500" : "")}
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>

              {/* Card number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Card number</label>
                <div className="relative">
                  <input
                    name="number" value={form.number} onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    className={"input w-full pr-12 font-mono tracking-widest " + (errors.number ? "border-red-500" : "")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">
                    {getCardType(form.number)}
                  </span>
                </div>
                {errors.number && <p className="text-xs text-red-400 mt-1">{errors.number}</p>}
              </div>

              {/* Name on card */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name on card</label>
                <input
                  name="name" value={form.name} onChange={handleChange}
                  placeholder="John Smith"
                  className={"input w-full " + (errors.name ? "border-red-500" : "")}
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>

              {/* Expiry + CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Expiry</label>
                  <input
                    name="expiry" value={form.expiry} onChange={handleChange}
                    placeholder="MM/YY"
                    className={"input w-full font-mono " + (errors.expiry ? "border-red-500" : "")}
                  />
                  {errors.expiry && <p className="text-xs text-red-400 mt-1">{errors.expiry}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">CVC</label>
                  <input
                    name="cvc" value={form.cvc} onChange={handleChange}
                    placeholder="123"
                    className={"input w-full font-mono " + (errors.cvc ? "border-red-500" : "")}
                  />
                  {errors.cvc && <p className="text-xs text-red-400 mt-1">{errors.cvc}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={upgrading}
                className="btn btn-primary w-full mt-2"
              >
                {upgrading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing payment…</>
                  : `Pay ${plan.price} — Subscribe to ${plan.name}`}
              </button>

              <p className="text-xs text-center text-gray-500">
                By subscribing you agree to our{" "}
                <Link to="/terms" className="underline hover:text-gray-300">Terms</Link>
                {" & "}
                <Link to="/privacy" className="underline hover:text-gray-300">Privacy Policy</Link>.
                Cancel anytime from your profile.
              </p>
            </form>
          </div>

          {/* Card logos */}
          <div className="flex items-center justify-center gap-3 mt-4 opacity-50">
            {["VISA", "MC", "AMEX", "DISC"].map((c) => (
              <div key={c} className="px-2 py-1 rounded border border-gray-700 text-gray-400 text-xs font-bold">{c}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCardType(num) {
  const n = num.replace(/\s/g, "");
  if (n.startsWith("4"))  return "VISA";
  if (n.startsWith("5"))  return "MC";
  if (n.startsWith("3"))  return "AMEX";
  if (n.startsWith("6"))  return "DISC";
  return "CARD";
}