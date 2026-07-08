import os
import sys
import shutil
import logging
import warnings
from contextlib import asynccontextmanager

# ============================================================
# PyTorch 2.6+ fix: weights_only default changed to True,
# which breaks loading YOLO .pt model files. Patch globally.
# ============================================================
try:
    import torch as _torch
    _torch_load_orig = _torch.load
    def _torch_load_patched(*args, **kwargs):
        kwargs.setdefault('weights_only', False)
        return _torch_load_orig(*args, **kwargs)
    _torch.load = _torch_load_patched
except Exception:
    pass

os.environ["ULTRALYTICS_ENABLE_CHECK"] = "False"
os.environ["ULTRALYTICS_NO_AUTO_UPDATE"] = "1"
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message="Function detectFace is deprecated")
_warn_orig = warnings.warn
def _quiet_warn(msg, *a, **kw):
    if "detectFace" in str(msg):
        return
    _warn_orig(msg, *a, **kw)
warnings.warn = _quiet_warn

from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.database.session import init_db, SessionLocal
from app.database.seed import seed_database, backfill_worker_notifications
from app.middleware.cors import setup_cors

os.makedirs(settings.LOG_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,  # Changed from WARNING to INFO to show processing logs
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(settings.LOG_DIR, "app.log"), encoding="utf-8"),
        logging.StreamHandler()  # Also print to console/terminal
    ],
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def cleanup_temp_data():
    try:
        for dir_path in [settings.REPORTS_DIR]:
            if os.path.exists(dir_path):
                shutil.rmtree(dir_path)
            os.makedirs(dir_path, exist_ok=True)
        os.makedirs(settings.EVIDENCE_DIR, exist_ok=True)
        os.makedirs(os.path.join(settings.EVIDENCE_DIR, "face_debug"), exist_ok=True)
        os.makedirs(os.path.join(settings.UPLOAD_DIR, "face_audit"), exist_ok=True)
        logger.info("Temp dirs created on startup")
    except Exception as e:
        logger.error(f"Cleanup error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Safety Monitor Application...")
    os.makedirs("data", exist_ok=True)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.WORKER_IMAGES_DIR, exist_ok=True)
    os.makedirs(settings.EVIDENCE_DIR, exist_ok=True)
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)

    init_db()
    logger.info("Database initialized")

    try:
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
        logger.info("Database seeded with initial data")
    except Exception as e:
        logger.error(f"Database seed error: {e}")

    # Backfill notifications for existing violations
    try:
        db = SessionLocal()
        try:
            backfill_worker_notifications(db)
        finally:
            db.close()
        logger.info("Worker notifications backfilled for existing violations")
    except Exception as e:
        logger.error(f"Notification backfill error: {e}")

    # Initialize MinIO bucket
    try:
        from app.storage.minio_client import ensure_bucket
        if ensure_bucket():
            logger.info("MinIO bucket initialized")
        else:
            logger.warning("MinIO bucket initialization skipped (MinIO not available)")
    except Exception as e:
        logger.warning(f"MinIO initialization skipped: {e}")

    cleanup_temp_data()

    # CRITICAL: Initialize DeepFace on the MAIN thread.
    # TensorFlow 2.x DLL initialization fails with 0x45A if called
    # from a background thread (_pywrap_tensorflow_common.dll DllMain).
    try:
        from app.detection.face.face_adapter import _warmup_deepface
        logger.info("Initializing DeepFace (Facenet512) on main thread...")
        _warmup_deepface()
        logger.info("DeepFace initialized successfully")
    except Exception as e:
        logger.error(f"DeepFace initialization FAILED: {e}")

    try:
        import threading
        from app.api.monitoring import _init_models_and_start
        thread = threading.Thread(target=_init_models_and_start, daemon=True)
        thread.start()
        logger.info("Monitoring init dispatched to background thread")
    except Exception as e:
        logger.error(f"Failed to dispatch monitoring init: {e}")

    yield
    logger.info("Shutting down Safety Monitor Application...")
    from app.api.monitoring import stream_manager, detection_manager
    stream_manager.stop_all()
    detection_manager.shutdown()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

setup_cors(app)

from app.auth.routes import router as auth_router
from app.api.workers import router as workers_router
from app.api.violations import router as violations_router
from app.api.fines import router as fines_router
from app.api.alerts import router as alerts_router
from app.api.cameras import router as cameras_router
from app.api.schemes import router as schemes_router
from app.api.monitoring import router as monitoring_router, face_runtime_router
from app.api.analytics import router as analytics_router
from app.api.reports import router as reports_router
from app.api.notifications import router as notifications_router
from app.api.trainings import router as trainings_router
from app.api.quizzes import router as quizzes_router
from app.api.emergency import router as emergency_router
from app.api.leaderboard import router as leaderboard_router
from app.api.settings import router as settings_router
from app.api.videos import router as videos_router
from app.api.penalty_rules import router as penalty_rules_router
from app.api.safety_officer import router as safety_officer_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(workers_router)
api_router.include_router(violations_router)
api_router.include_router(fines_router)
api_router.include_router(alerts_router)
api_router.include_router(cameras_router)
api_router.include_router(schemes_router)
api_router.include_router(monitoring_router)
api_router.include_router(analytics_router)
api_router.include_router(reports_router)
api_router.include_router(notifications_router)
api_router.include_router(trainings_router)
api_router.include_router(quizzes_router)
api_router.include_router(emergency_router)
api_router.include_router(leaderboard_router)
api_router.include_router(settings_router)
api_router.include_router(face_runtime_router)
api_router.include_router(videos_router)
api_router.include_router(penalty_rules_router)
api_router.include_router(safety_officer_router)


@api_router.get("/health")
def api_health():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}


app.include_router(api_router)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
