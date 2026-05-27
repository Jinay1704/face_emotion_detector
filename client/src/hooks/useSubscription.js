import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";
import { useApi } from "../utils/axiosInstance";

export function useSubscription() {
  const { isSignedIn } = useUser();
  const api = useApi();

  const [subscription, setSubscription] = useState(null);
  const [plans,        setPlans]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [upgrading,    setUpgrading]    = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await api.get("/subscription/me");
      setSubscription(res.data.data);
    } catch (_) {}
    finally { setLoading(false); }
  }, [isSignedIn]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get("/subscription/plans");
      setPlans(res.data.data.plans);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchSubscription();
      fetchPlans();
    }
  }, [isSignedIn]);

  const upgrade = useCallback(async (plan) => {
    setUpgrading(true);
    try {
      const res  = await api.post("/subscription/upgrade", { plan });
      const data = res.data.data;

      if (data.requiresPayment && data.checkoutUrl) {
        // ── Clerk Billing is configured → redirect to payment ──
        toast.success("Redirecting to payment...");
        window.location.href = data.checkoutUrl;
        return true;
      } else {
        // ── Direct upgrade (dev mode / no payment configured) ──
        setSubscription((prev) => ({
          ...prev,
          plan:   data.plan,
          limits: data.limits,
        }));
        toast.success("🎉 Upgraded to " + plan.charAt(0).toUpperCase() + plan.slice(1) + "!");
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upgrade failed");
      return false;
    } finally {
      setUpgrading(false);
    }
  }, [api]);

  const downgrade = useCallback(async () => {
    setUpgrading(true);
    try {
      await api.post("/subscription/downgrade");
      setSubscription((prev) => ({ ...prev, plan: "free" }));
      toast.success("Downgraded to Free plan");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Downgrade failed");
      return false;
    } finally {
      setUpgrading(false);
    }
  }, [api]);

  const isAtLimit   = () => subscription && !subscription.usage?.isUnlimited && subscription.usage?.remaining <= 0;
  const canUseVideo = () => subscription?.limits?.allowVideo === true;

  return { subscription, plans, loading, upgrading, fetchSubscription, fetchPlans, upgrade, downgrade, isAtLimit, canUseVideo };
}