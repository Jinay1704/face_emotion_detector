import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useApi } from "../utils/axiosInstance";

export function usePrediction() {
  const api       = useApi();
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error,     setError]     = useState(null);

  const reset = useCallback(() => { setResult(null); setError(null); setUploadPct(0); }, []);

  const runImagePrediction = useCallback(async (file, useFaceDetection = true) => {
    setLoading(true); setError(null); setResult(null); setUploadPct(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("use_face_detection", useFaceDetection ? "true" : "false");
      const res = await api.post("/predict/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
        onUploadProgress: (e) => e.total && setUploadPct(Math.round(e.loaded / e.total * 100)),
      });
      setResult({ type: "image", ...res.data.data });
      toast.success("Detection complete!");
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Prediction failed";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, [api]);

  const runVideoPrediction = useCallback(async (file, options = {}) => {
    setLoading(true); setError(null); setResult(null); setUploadPct(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("frame_skip", options.frameSkip || 6);
      fd.append("max_frames",  options.maxFrames || 150);
      fd.append("save_video",  options.saveVideo !== false ? "true" : "false");
      const res = await api.post("/predict/video", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
        onUploadProgress: (e) => e.total && setUploadPct(Math.round(e.loaded / e.total * 100)),
      });
      setResult({ type: "video", ...res.data.data });
      toast.success("Video analysis complete!");
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Video prediction failed";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, [api]);

  return { result, loading, uploadPct, error, reset, runImagePrediction, runVideoPrediction };
}