import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { formatFileSize } from "../../utils/formatters";
import Loader from "../common/Loader";

export default function ImageUploader({ onSubmit, loading, uploadPct, disabled }) {
  const [file, setFile]                     = useState(null);
  const [preview, setPreview]               = useState(null);
  const [useFaceDetection, setUseFaceDetect] = useState(true);

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [".jpg",".jpeg",".png",".webp"] }, maxFiles: 1, disabled: loading || disabled,
  });

  const clear = () => { setFile(null); setPreview(null); };

  return (
    <div className="space-y-4">
      {!file ? (
        <div {...getRootProps()} className={"border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all " + (isDragActive ? "border-indigo-500 bg-indigo-500/5" : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/50")}>
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-300">{isDragActive ? "Drop it!" : "Drag & drop or click to browse"}</p>
          <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP · max 5 MB (Free)</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-900">
          <img src={preview} alt="Preview" className="w-full max-h-72 object-contain bg-gray-950" />
          {!loading && (
            <button onClick={clear} className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="px-4 py-2 flex items-center gap-2 border-t border-gray-800">
            <ImageIcon className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-400 truncate">{file.name}</span>
            <span className="text-xs text-gray-600 ml-auto">{formatFileSize(file.size)}</span>
          </div>
        </div>
      )}

      {file && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={useFaceDetection} onChange={(e) => setUseFaceDetect(e.target.checked)} className="w-4 h-4 accent-indigo-500" disabled={loading} />
          <span className="text-sm text-gray-300">Use MediaPipe face detection <span className="text-gray-500">(recommended)</span></span>
        </label>
      )}

      {loading && uploadPct > 0 && uploadPct < 100 && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Uploading…</span><span>{uploadPct}%</span></div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: uploadPct + "%" }} /></div>
        </div>
      )}

      <button onClick={() => onSubmit(file, useFaceDetection)} disabled={!file || loading || disabled} className="btn-primary w-full btn-lg">
        {loading ? <><Loader size="sm" /> Analysing…</> : "🔍 Detect Emotions"}
      </button>
    </div>
  );
}