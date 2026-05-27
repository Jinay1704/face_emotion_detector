export const EMOTION_EMOJI  = { angry: "😠", happy: "😊", sad: "😢" };
export const EMOTION_COLOR  = { angry: "#e74c3c", happy: "#f1c40f", sad: "#2980b9" };
export const EMOTION_BORDER = {
  angry: "border-red-500/30 bg-red-500/5",
  happy: "border-yellow-500/30 bg-yellow-500/5",
  sad:   "border-blue-500/30 bg-blue-500/5",
};

export const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

export const formatDateTime = (d) => new Date(d).toLocaleString("en-US", {
  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
});

export const formatLatency = (ms) => {
  if (!ms) return "-";
  return ms < 1000 ? ms + " ms" : (ms / 1000).toFixed(1) + " s";
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const getPlanBadgeClass = (plan) =>
  ({ free: "badge-free", pro: "badge-pro", enterprise: "badge-enterprise" }[plan] || "badge-free");