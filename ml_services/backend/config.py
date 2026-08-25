"""
backend/config.py
Central config for Face Emotion Detection project.
"""
import os
import logging

logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR   = os.path.join(PROJECT_ROOT, "models")

# ── Model path: try local cache first, only hit network if needed ──────────────
def _resolve_model_path():
    """
    Returns path to the .keras model file.
    Priority:
      1. Local env override (MODEL_PATH env var)
      2. Local models/ directory (fast, no network)
      3. HuggingFace Hub cache (downloads once, then reuses cache)
    """
    # 1. Explicit env override
    env_path = os.environ.get("MODEL_PATH")
    if env_path and os.path.exists(env_path):
        logger.info("Using model from MODEL_PATH env: %s", env_path)
        return env_path

    # 2. Local models/ directory
    local_path = os.path.join(MODELS_DIR, "efficientnet_full_model.keras")
    if os.path.exists(local_path):
        logger.info("Using local model: %s", local_path)
        return local_path

    # 3. HuggingFace Hub — try local cache first to avoid network latency
    try:
        from huggingface_hub import hf_hub_download
        # local_files_only=True first — returns instantly if already cached
        path = hf_hub_download(
            repo_id="Jinay1704/emotion-model",
            filename="efficientnet_full_model.keras",
            local_files_only=True,
        )
        logger.info("Using cached HF model: %s", path)
        return path
    except Exception:
        pass

    # 4. Download from HF Hub (first-time only, cached after)
    logger.info("Downloading model from HuggingFace Hub (first-time only)...")
    from huggingface_hub import hf_hub_download
    path = hf_hub_download(
        repo_id="Jinay1704/emotion-model",
        filename="efficientnet_full_model.keras",
    )
    logger.info("Model downloaded and cached: %s", path)
    return path


MODEL_PATH = _resolve_model_path()

# Classes — exactly as in your Colab CONFIGURATION dict
CLASS_NAMES = ["angry", "happy", "sad"]

EMOTION_EMOJI = {
    "angry": "😠",
    "happy": "😊",
    "sad":   "😢",
}

EMOTION_COLORS_BGR = {
    "angry": (0,   0,   220),
    "happy": (0,   215, 255),
    "sad":   (205, 92,  0),
}

# Preprocessing — EfficientNet-B4 accepts 224 or 256; 224 is faster with no accuracy drop
IM_SIZE = 224

# MediaPipe face detection
MP_CONFIDENCE  = 0.5
MP_MODEL_SEL   = 1      # 1 = full range, good for group photos up to 5m
FACE_PAD_RATIO = 0.15   # reduced from 0.20 — less padding = smaller crop = faster inference
MIN_FACE_PX    = 40

# Video
FRAME_SKIP = 6
MAX_FRAMES = 150
OUTPUT_FPS = 10

# Flask
FLASK_HOST  = "0.0.0.0"
FLASK_PORT  = 5000
DEBUG       = False
MAX_CONTENT_LENGTH = 100 * 1024 * 1024   # 100 MB upload limit