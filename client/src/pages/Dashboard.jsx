import { useState } from "react";
import { Link } from "react-router-dom";
import { Image, Video, AlertTriangle, TrendingUp } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { usePrediction }  from "../hooks/usePrediction";
import { useSubscription } from "../hooks/useSubscription";
import ImageUploader from "../components/prediction/ImageUploader";
import VideoUploader from "../components/prediction/VideoUploader";
import ResultCard    from "../components/prediction/ResultCard";
import Loader        from "../components/common/Loader";
import { getPlanBadgeClass } from "../utils/formatters";

export default function Dashboard() {
  const { user }                                           = useUser();
  const { subscription, isAtLimit, canUseVideo }           = useSubscription();
  const { result, loading, uploadPct, error, reset, runImagePrediction, runVideoPrediction } = usePrediction();
  const [tab, setTab] = useState("image");

  const atLimit  = isAtLimit();
  const hasVideo = canUseVideo();
  const plan     = subscription?.plan || "free";

  return (
    <div className="section py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Hello, {user?.firstName || "there"} 👋 Detect emotions in images & videos</p>
        </div>
        {subscription && (
          <div className="card-sm flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-500">Plan</p>
              <span className={getPlanBadgeClass(plan)}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </span>
            </div>
            <div className="border-l border-gray-800 pl-4">
              <p className="text-xs text-gray-500">Used this month</p>
              <p className="text-sm font-semibold text-white">
                {subscription.usage.used}
                <span className="text-gray-500 font-normal">
                  {" / "}{subscription.usage.isUnlimited ? "∞" : subscription.usage.total}
                </span>
              </p>
            </div>
            {plan === "free" && (
              <Link to="/pricing" className="btn-primary btn-sm">⚡ Upgrade</Link>
            )}
          </div>
        )}
      </div>

      {/* Limit warning */}
      {atLimit && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-900/20 border border-orange-700/50 text-orange-300">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Monthly limit reached</p>
            <p className="text-sm opacity-80">
              <Link to="/pricing" className="underline">Upgrade your plan</Link> to continue detecting emotions.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Upload panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl">
            <TabBtn active={tab === "image"} onClick={() => { setTab("image"); reset(); }} icon={<Image className="h-4 w-4" />} label="Image" />
            <TabBtn active={tab === "video"} onClick={() => { setTab("video"); reset(); }} icon={<Video className="h-4 w-4" />} label="Video" disabled={!hasVideo} disabledLabel="Pro+" />
          </div>

          {tab === "image"
            ? <ImageUploader onSubmit={runImagePrediction} loading={loading} uploadPct={uploadPct} disabled={atLimit} />
            : <VideoUploader onSubmit={runVideoPrediction} loading={loading} uploadPct={uploadPct} disabled={atLimit} />
          }
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {!result && !loading && !error && (
            <div className="h-full min-h-64 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-800 text-gray-600">
              <TrendingUp className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Results will appear here after detection</p>
            </div>
          )}
          {loading && !result && (
            <div className="h-full min-h-64 flex items-center justify-center">
              <Loader size="lg" text="Analysing…" />
            </div>
          )}
          {error && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 text-red-300 text-sm">{error}</div>
          )}
          {result && <ResultCard result={result} />}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, disabled, disabledLabel }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={
        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all " +
        (active ? "bg-indigo-600 text-white" : disabled ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-gray-800")
      }
    >
      {icon} {label}
      {disabled && disabledLabel && (
        <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-full">{disabledLabel}</span>
      )}
    </button>
  );
}