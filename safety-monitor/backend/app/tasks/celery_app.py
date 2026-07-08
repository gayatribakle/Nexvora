import os
import sys
import logging

# Ensure the backend directory is in the path
_backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app.config.settings import settings

logger = logging.getLogger(__name__)

celery_app = None

try:
    from celery import Celery
    
    celery_app = Celery(
        "safety_monitor",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND,
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
        broker_connection_retry_on_startup=True,
    )

    # Auto-discover tasks
    celery_app.autodiscover_tasks(["app.tasks"])
    logger.info("Celery initialized successfully")
except Exception as e:
    logger.warning(f"Celery initialization failed (tasks will run synchronously): {e}")
    celery_app = None
