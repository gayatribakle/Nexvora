import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.database.models import EmergencyAlert, User, SystemLog
from app.auth.dependencies import get_current_user, require_admin
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/emergency", tags=["Emergency"])


@router.get("")
def list_emergencies(
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(EmergencyAlert)
    if is_active is not None:
        query = query.filter(EmergencyAlert.is_active == is_active)

    alerts = query.order_by(desc(EmergencyAlert.created_at)).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "message": a.message,
            "severity": a.severity,
            "is_active": a.is_active,
            "created_at": str(a.created_at),
        }
        for a in alerts
    ]


@router.post("")
def create_emergency(
    title: str,
    message: str,
    severity: str = "orange",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    alert = EmergencyAlert(
        title=title,
        message=message,
        severity=severity,
        created_by=current_user.id,
    )
    db.add(alert)
    db.flush()

    log = SystemLog(
        action="emergency_created",
        entity_type="emergency_alert",
        entity_id=alert.id,
        user_id=current_user.id,
        details=f"Emergency alert: {title} ({severity})",
    )
    db.add(log)
    db.commit()

    notif_svc = NotificationService(db)
    notif_svc.broadcast_alert(title, message, severity)

    return {"message": "Emergency alert created", "id": alert.id}


@router.put("/{alert_id}/resolve")
def resolve_emergency(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Emergency alert not found")

    alert.is_active = False
    alert.resolved_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Emergency resolved"}
