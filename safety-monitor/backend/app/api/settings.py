from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.database.models import User, SystemLog
from app.auth.dependencies import get_current_user, require_admin
from app.config.settings import settings as app_settings

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("")
def get_settings(current_user: User = Depends(require_admin)):
    return {
        "fine_ppe_violation": app_settings.FINE_PPE_VIOLATION,
        "fine_smoking": app_settings.FINE_SMOKING,
        "fine_multiple_same_day": app_settings.FINE_MULTIPLE_SAME_DAY,
        "confidence_threshold": app_settings.CONFIDENCE_THRESHOLD,
        "face_match_threshold": app_settings.FACE_MATCH_THRESHOLD,
        "alert_cooldown_seconds": app_settings.ALERT_COOLDOWN_SECONDS,
        "frame_skip": app_settings.FRAME_SKIP,
        "max_cameras": app_settings.MAX_CAMERAS,
    }


@router.put("")
def update_settings(
    fine_ppe_violation: Optional[int] = None,
    fine_smoking: Optional[int] = None,
    fine_multiple_same_day: Optional[int] = None,
    confidence_threshold: Optional[float] = None,
    alert_cooldown_seconds: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if fine_ppe_violation is not None:
        app_settings.FINE_PPE_VIOLATION = fine_ppe_violation
    if fine_smoking is not None:
        app_settings.FINE_SMOKING = fine_smoking
    if fine_multiple_same_day is not None:
        app_settings.FINE_MULTIPLE_SAME_DAY = fine_multiple_same_day
    if confidence_threshold is not None:
        app_settings.CONFIDENCE_THRESHOLD = confidence_threshold
    if alert_cooldown_seconds is not None:
        app_settings.ALERT_COOLDOWN_SECONDS = alert_cooldown_seconds

    log = SystemLog(
        action="update_settings",
        user_id=current_user.id,
        details="System settings updated",
    )
    db.add(log)
    db.commit()

    return {"message": "Settings updated"}
