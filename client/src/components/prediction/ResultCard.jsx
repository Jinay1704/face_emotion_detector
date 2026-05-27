import { Download } from "lucide-react";
import { EMOTION_EMOJI, EMOTION_COLOR, EMOTION_BORDER, capitalize, formatLatency } from "../../utils/formatters";

export default function ResultCard({ result }) {
  if (!result) return null;

  const {
    type,
    originalUrl,
    annotatedUrl,
    num_faces,
    faces,
    summary,
    latency_ms,
    frames_processed,
  } = result;

  console.log("RESULT:", result);

  const dominant = summary?.dominant_emotion;

  return (
    <div className="space-y-5 mt-2">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Faces" value={num_faces ?? 0} />
        <Metric
          label="Dominant"
          value={dominant ? (
            <span>
              {EMOTION_EMOJI[dominant]} {capitalize(dominant)}
            </span>
          ) : "—"}
        />
        <Metric label="Latency" value={formatLatency(latency_ms)} />
      </div>

      {/* Media pair */}
      {(originalUrl || annotatedUrl) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {originalUrl && (
            <MediaBox url={originalUrl} label="Original" type={type} />
          )}
          {annotatedUrl && (
            <MediaBox url={annotatedUrl} label="Annotated" type={type} primary />
          )}
        </div>
      )}

      {/* Per-face results */}
      {faces && faces.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            {faces.length} face{faces.length !== 1 ? "s" : ""} detected
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {faces.map((face) => (
              <FaceCard key={face.face_id} face={face} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="card-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function MediaBox({ url, label, type, primary }) {
  const mediaUrl = url; // Cloudinary URLs are already absolute and correct

  const handleDownload = async () => {
    try {
      const res = await fetch(mediaUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = label.toLowerCase() + "." + (type === "video" ? "mp4" : "jpg");
      a.click();
    } catch {
      window.open(mediaUrl, "_blank");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
        {type === "video" ? (
          <video
            key={mediaUrl}          // 🔴 force reload when URL changes
            src={mediaUrl}
            controls
            preload="metadata"      // 🔴 load metadata so duration/preview shows
            crossOrigin="anonymous" // 🔴 required for Cloudinary
            className="w-full max-h-64"
            onError={(e) => console.error("Video load error:", e, mediaUrl)}
          />
        ) : (
          <img
            src={mediaUrl}
            alt={label}
            className="w-full max-h-64 object-contain"
          />
        )}
      </div>
      <button
        onClick={handleDownload}
        className={primary ? "btn-primary btn-sm w-full" : "btn-secondary btn-sm w-full"}
      >
        <Download className="h-3.5 w-3.5" /> Download {label.toLowerCase()}
      </button>
    </div>
  );
}

function FaceCard({ face }) {
  const e = face.emotion;
  return (
    <div className={`card border ${EMOTION_BORDER[e] || "border-gray-700"}`}>
      <div className="text-center mb-3">
        <span className="text-4xl">{EMOTION_EMOJI[e]}</span>
        <p className="text-lg font-bold text-white mt-1">{capitalize(e)}</p>
        <p className="text-xs text-gray-400">
          Face #{face.face_id} · {(face.confidence * 100).toFixed(1)}%
        </p>
      </div>
      <div className="space-y-2">
        {(face.all_preds || []).map((p) => (
          <div key={p.emotion} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-10 text-right">
              {EMOTION_EMOJI[p.emotion]}
            </span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: p.probability * 100 + "%",
                  background: EMOTION_COLOR[p.emotion] || "#6366f1",
                }}
              />
            </div>
            <span className="text-xs text-gray-500 w-9 font-mono">
              {(p.probability * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
