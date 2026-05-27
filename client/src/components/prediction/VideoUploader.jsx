import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Video } from "lucide-react";
import { formatFileSize } from "../../utils/formatters";
import Loader from "../common/Loader";

export default function VideoUploader({ onSubmit, loading, uploadPct, disabled }) {
  const [file,      setFile]      = useState(null);
  const [frameSkip, setFrameSkip] = useState(6);
  const [maxFrames, setMaxFrames] = useState(150);
  const [saveVideo, setSaveVideo] = useState(true);

  const onDrop = useCallback((accepted) => { const f = accepted[0]; if (f) setFile(f); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "video/*": [".mp4",".avi",".mov",".mkv"] }, maxFiles: 1, disabled: loading || disabled,
  });

  return (
    <div className="space-y-4">
      {!file ? (
        <div {...getRootProps()} className={"border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all " + (isDragActive ? "border-indigo-500 bg-indigo-500/5" : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/50")}>
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-300">{isDragActive ? "Drop it!" : "Drag & drop a video"}</p>
          <p className="text-xs text-gray-500 mt-1">MP4, AVI, MOV · max 50 MB (Pro)</p>
        </div>
      ) : (
        <div className="card-sm flex items-center gap-3">
          <Video className="h-8 w-8 text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
          {!loading && <button onClick={() => setFile(null)} className="text-gray-500 hover:text-red-400 transition-colors"><X className="h-4 w-4" /></button>}
        </div>
      )}

      {file && (
        <div className="card-sm space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Options</p>
          <div>
            <label className="label">Frame skip: <span className="text-indigo-400">{frameSkip}</span></label>
            <input type="range" min={1} max={15} value={frameSkip} onChange={(e) => setFrameSkip(+e.target.value)} className="w-full accent-indigo-500" disabled={loading} />
          </div>
          <div>
            <label className="label">Max frames: <span className="text-indigo-400">{maxFrames}</span></label>
            <input type="range" min={30} max={300} step={10} value={maxFrames} onChange={(e) => setMaxFrames(+e.target.value)} className="w-full accent-indigo-500" disabled={loading} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={saveVideo} onChange={(e) => setSaveVideo(e.target.checked)} className="w-4 h-4 accent-indigo-500" disabled={loading} />
            <span className="text-sm text-gray-300">Generate annotated video</span>
          </label>
        </div>
      )}

      {loading && uploadPct >= 100 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
          <Loader size="sm" />
          <p className="text-sm text-gray-400">Analysing video… this may take a minute.</p>
        </div>
      )}

      <button onClick={() => onSubmit(file, { frameSkip, maxFrames, saveVideo })} disabled={!file || loading || disabled} className="btn-primary w-full btn-lg">
        {loading ? <><Loader size="sm" /> Processing…</> : "🎥 Analyse Video"}
      </button>
    </div>
  );
}