import { useEffect, useState } from "react";
import { Clock, Image, Video, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useApi } from "../utils/axiosInstance";
import { formatDateTime, EMOTION_EMOJI, capitalize } from "../utils/formatters";
import Loader, { PageLoader } from "../components/common/Loader";

export default function History() {
  const api = useApi();
  const [predictions, setPredictions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState(null);
  const [typeFilter,  setTypeFilter]  = useState("");
  const [deleting,    setDeleting]    = useState(null);
  const [expanded,    setExpanded]    = useState(null);

  const fetchHistory = async (p = 1, type = "") => {
    setLoading(true);
    try {
      const res = await api.get("/predict/history", { params: { page: p, limit: 10, type: type || undefined } });
      setPredictions(res.data.data.predictions);
      setPagination(res.data.data.pagination);
    } catch { toast.error("Failed to load history"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(page, typeFilter); }, [page, typeFilter]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this prediction?")) return;
    setDeleting(id);
    try {
      await api.delete("/predict/" + id);
      toast.success("Deleted");
      fetchHistory(page, typeFilter);
    } catch { toast.error("Delete failed"); }
    finally { setDeleting(null); }
  };

  if (loading && !predictions.length) return <PageLoader />;

  return (
    <div className="section py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Prediction History</h1>
          <p className="page-sub">{pagination ? pagination.total + " total predictions" : ""}</p>
        </div>
        <div className="flex gap-2">
          {["", "image", "video"].map((t) => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
              className={"btn-sm " + (typeFilter === t ? "btn-primary" : "btn-secondary")}>
              {t === "" ? "All" : capitalize(t)}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex justify-center py-8"><Loader /></div>}

      {!loading && predictions.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No predictions yet — go to the Dashboard to get started</p>
        </div>
      )}

      <div className="space-y-3">
        {predictions.map((p) => {
          const dominant = p.result?.summary?.dominant_emotion;
          return (
            <div key={p._id} className="card hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                  {p.type === "video" ? <Video className="h-5 w-5" /> : <Image className="h-5 w-5" />}
                </div>
                {p.annotatedUrl && (
                  <img src={p.annotatedUrl} alt="" className="h-12 w-16 object-cover rounded-lg border border-gray-800" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white capitalize">{p.type}</span>
                    {dominant && <span className="text-sm text-gray-400">{EMOTION_EMOJI[dominant]} {capitalize(dominant)}</span>}
                    {p.result?.num_faces !== undefined && <span className="text-xs text-gray-600">{p.result.num_faces} face{p.result.num_faces !== 1 ? "s" : ""}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(p.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setExpanded(expanded === p._id ? null : p._id)} className="btn-ghost btn-sm">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p._id)} disabled={deleting === p._id}
                    className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors disabled:opacity-50">
                    {deleting === p._id ? <Loader size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {expanded === p._id && (
                <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {p.originalUrl  && <img src={p.originalUrl}  alt="Original"  className="rounded-lg border border-gray-800 w-full object-contain max-h-64 bg-gray-950" />}
                  {p.annotatedUrl && <img src={p.annotatedUrl} alt="Annotated" className="rounded-lg border border-gray-800 w-full object-contain max-h-64 bg-gray-950" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary btn-sm"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-gray-400">Page {pagination.page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages} className="btn-secondary btn-sm"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}