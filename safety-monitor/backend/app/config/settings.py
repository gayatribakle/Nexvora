from pydantic_settings import BaseSettings
from typing import List
import os

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_PROJECT_ROOT = os.path.dirname(_BACKEND_ROOT)
_MODELS_DIR = os.path.join(os.path.dirname(_PROJECT_ROOT), "models")
if not os.path.exists(os.path.join(_MODELS_DIR, "Construction-Site-Safety-PPE-Detection-main")):
    _MODELS_DIR = os.path.join(_PROJECT_ROOT, "models")
_VIDEOS_DIR = os.path.join(os.path.dirname(_PROJECT_ROOT), "videos")
if not os.path.exists(os.path.join(_VIDEOS_DIR, "cam1.mp4")):
    _VIDEOS_DIR = os.path.join(_PROJECT_ROOT, "videos")

class Settings(BaseSettings):
    APP_NAME: str = "Construction Site Safety Monitor"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database - SQLite (default) or PostgreSQL
    DATABASE_URL: str = "sqlite:///./data/safety_monitor.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # MinIO Object Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "safety-monitor"
    MINIO_SECURE: bool = False

    SECRET_KEY: str = "super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    UPLOAD_DIR: str = os.path.join(_BACKEND_ROOT, "uploads")
    WORKER_IMAGES_DIR: str = os.path.join(_BACKEND_ROOT, "uploads", "workers")
    EVIDENCE_DIR: str = os.path.join(_BACKEND_ROOT, "uploads", "evidence")
    REPORTS_DIR: str = os.path.join(_BACKEND_ROOT, "uploads", "reports")
    LOG_DIR: str = os.path.join(_BACKEND_ROOT, "logs")

    MODEL_PPE_PATH: str = os.path.join(_MODELS_DIR, "Construction-Site-Safety-PPE-Detection-main", "models", "best.pt")
    MODEL_SMOKING_PATH: str = os.path.join(_MODELS_DIR, "Smoking-Detection-main", "yolov5", "epochs_100", "weights.pt")
    MODEL_FIRE_PATH: str = os.path.join(_MODELS_DIR, "YOLOv8-Fire-and-Smoke-Detection-main", "runs", "detect", "train", "weights", "best.pt")
    DEEPFACE_PATH: str = os.path.join(_MODELS_DIR, "deepface-master")

    VIDEO_PATHS: List[str] = [
        os.path.join(_VIDEOS_DIR, f"cam{i}.mp4") for i in range(1, 5)
    ]

    CONFIDENCE_THRESHOLD: float = 0.35  # General threshold
    SMOKING_CONFIDENCE_THRESHOLD: float = 0.65  # High threshold for smoking to reduce false positives
    SMOKING_TEMPORAL_FRAMES: int = 3  # Require 3 consecutive frames to confirm smoking
    FACE_MATCH_THRESHOLD: float = 0.42  # Increased from 0.38 to prevent false positives (unknown people matching registered workers)
    FACE_MATCH_MIN_GAP: float = 0.05  # Increased from 0.02 to require bigger separation between potential matches
    ALERT_COOLDOWN_SECONDS: int = 900  # 15 minutes - prevents spam from same violation type per worker/camera
    MAX_CAMERAS: int = 4
    FRAME_SKIP: int = 3
    DETECTION_INTERVAL: float = 0.5

    FINE_PPE_VIOLATION: int = 100
    FINE_SMOKING: int = 200
    FINE_MULTIPLE_SAME_DAY: int = 50

    SAFETY_SCORE_INITIAL: int = 100
    SAFETY_SCORE_VIOLATION_PENALTY: int = 10
    SAFETY_SCORE_TRAINING_BONUS: int = 5
    SAFETY_SCORE_QUIZ_BONUS: int = 3
    SAFETY_SCORE_SAFE_BONUS: int = 2

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]

    # Video Upload
    MAX_VIDEO_SIZE_MB: int = 500
    ALLOWED_VIDEO_FORMATS: List[str] = ["mp4", "avi", "mov", "mkv"]
    VIDEO_PROCESSING_FPS: float = 2.0

    # Evidence
    EVIDENCE_VIDEO_CLIP_SECONDS: int = 5

    # SSL/HTTPS
    SSL_CERTFILE: str = ""
    SSL_KEYFILE: str = ""

    # SMTP Email
    SMTP_SERVER: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@safetymonitor.com"
    SMTP_USE_TLS: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
