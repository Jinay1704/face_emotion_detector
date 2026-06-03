"""
backend/config.py
Central config for Face Emotion Detection project.
"""
import os
from huggingface_hub import hf_hub_download

# Paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR   = os.path.join(PROJECT_ROOT, "models")

MODEL_PATH = hf_hub_download(
    repo_id="Jinay1704/emotion-model",
    filename="efficientnet_full_model.keras"
)

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

# Preprocessing — EfficientNet-B4 fine-tuned, 256x256 RGB input
IM_SIZE = 256

# MediaPipe face detection
MP_CONFIDENCE  = 0.5
MP_MODEL_SEL   = 1      # 1 = full range, good for group photos up to 5m
FACE_PAD_RATIO = 0.20
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