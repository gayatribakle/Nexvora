from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database.session import get_db
from app.database.models import Alert, User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("")
def list_alerts(
    is_read: Optional[bool] = None,
    is_emergency: Optional[bool] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Alert)
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)
    if is_emergency is not None:
        query = query.filter(Alert.is_emergency == is_emergency)

    total = query.count()
    alerts = query.order_by(desc(Alert.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "alerts": [
            {
                "id": a.id,
                "camera_id": a.camera_id,
                "violation_type": a.violation_type,
                "severity": a.severity,
                "message": a.message,
                "worker_name": a.worker_name,
                "is_read": a.is_read,
                "is_emergency": a.is_emergency,
                "created_at": str(a.created_at),
            }
            for a in alerts
        ],
    }


@router.put("/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"message": "Alert marked as read"}


@router.put("/read-all")
def mark_all_alerts_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All alerts marked as read"}


@router.delete("/clear-all")
def clear_all_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Alert).count()
    db.query(Alert).delete()
    db.commit()
    return {"message": f"Cleared {count} alerts"}


@router.delete("/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted"}
