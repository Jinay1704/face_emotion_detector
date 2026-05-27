"""
backend/app.py  -  Flask server for Emotion Detection
Run: python app.py
"""
import base64
import logging
import os
import sys
import tempfile

from flask import Flask, jsonify, request, send_file

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import (
    FLASK_HOST, FLASK_PORT, DEBUG,
    CLASS_NAMES, MODEL_PATH,
    FRAME_SKIP, MAX_FRAMES,
    MAX_CONTENT_LENGTH,
)
from model_loader import warmup
from inference import predict_image, predict_video

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

# Temp video store: filename -> full path
_video_store = {}

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/avi", "video/quicktime", "video/x-matroska"}


# ── Startup warmup ────────────────────────────────────────────────────────────

def _startup():
    if not os.path.exists(MODEL_PATH):
        logger.warning(
            "Model not found at %s\n"
            "  Save from Colab with: finetuned_model.save('efficientnet_full_model.keras')\n"
            "  Then copy it to your local models/ folder.",
            MODEL_PATH,
        )
    else:
        try:
            warmup()
            logger.info("EfficientNet-B4 warmed up and ready.")
        except Exception as e:
            logger.warning("Warmup failed (non-fatal): %s", str(e))


# ── Health ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":      "ok",
        "model":       "EfficientNet-B4 (fine-tuned)",
        "classes":     CLASS_NAMES,
        "model_ready": os.path.exists(MODEL_PATH),
    })


# ── Image prediction ──────────────────────────────────────────────────────────

@app.route("/predict/image", methods=["POST"])
def api_predict_image():
    """
    POST /predict/image
    Form fields:
        file               : image file (JPG / PNG / WEBP)
        use_face_detection : "true" or "false"  (default "true")

    Returns JSON:
        num_faces, faces, summary, annotated_image_b64, latency_ms
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send as multipart/form-data with key 'file'."}), 400

    f = request.files["file"]
    if f.content_type not in ALLOWED_IMAGE_TYPES:
        return jsonify({"error": "Unsupported file type: " + str(f.content_type)}), 400

    image_bytes = f.read()
    if not image_bytes:
        return jsonify({"error": "Empty file."}), 400

    if not os.path.exists(MODEL_PATH):
        return jsonify({"error": "Model not loaded. Copy efficientnet_full_model.keras to models/"}), 503

    use_detection = request.form.get("use_face_detection", "true").lower() == "true"

    try:
        result = predict_image(image_bytes, use_face_detection=use_detection)
    except Exception as e:
        logger.exception("Image prediction failed")
        return jsonify({"error": str(e)}), 500

    # Convert raw image bytes to base64 for JSON transport
    img_b64 = base64.b64encode(result.pop("annotated_image_bytes")).decode("utf-8")
    result["annotated_image_b64"] = img_b64
    return jsonify(result)


# ── Video prediction ──────────────────────────────────────────────────────────

@app.route("/predict/video", methods=["POST"])
def api_predict_video():
    """
    POST /predict/video
    Form fields:
        file        : video file (MP4 / AVI / MOV)
        frame_skip  : int, default 3
        max_frames  : int, default 300
        save_video  : "true" or "false", default "true"

    Returns JSON:
        frames_processed, video_meta, frame_results,
        summary, timeline, annotated_video_url, latency_ms
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    f = request.files["file"]
    video_bytes = f.read()
    if not video_bytes:
        return jsonify({"error": "Empty file."}), 400

    if not os.path.exists(MODEL_PATH):
        return jsonify({"error": "Model not loaded."}), 503

    try:
        frame_skip = int(request.form.get("frame_skip", FRAME_SKIP))
        max_frames = int(request.form.get("max_frames", MAX_FRAMES))
        save_video = request.form.get("save_video", "true").lower() == "true"
    except ValueError:
        return jsonify({"error": "frame_skip and max_frames must be integers."}), 400

    try:
        result = predict_video(
            video_bytes,
            frame_skip=frame_skip,
            max_frames=max_frames,
            save_video=save_video,
        )
    except Exception as e:
        logger.exception("Video prediction failed")
        return jsonify({"error": str(e)}), 500

    # Store annotated video path and expose download URL
    video_path = result.pop("output_video_path", None)
    if video_path and os.path.exists(video_path):
        fname = os.path.basename(video_path)
        _video_store[fname] = video_path
        result["annotated_video_url"] = "/download/" + fname

    return jsonify(result)


# ── Video download / streaming ────────────────────────────────────────────────

@app.route("/download/<filename>", methods=["GET"])
def download_video(filename):
    """GET /download/<filename>  ->  stream MP4 for preview or download"""
    path = _video_store.get(filename)
    if not path or not os.path.exists(path):
        return jsonify({"error": "Video not found or expired."}), 404

    response = send_file(
        path,
        mimetype="video/mp4",
        as_attachment=False,
        download_name=filename
    )

    # ✅ Allow video streaming & seeking
    response.headers["Accept-Ranges"] = "bytes"
    response.headers["Cache-Control"] = "no-cache"

    return response


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",   # required for Docker — listens on all interfaces
        port=5001,
        debug=True,
        use_reloader=False
    )
