from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.database.models import NotificationHistory, User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def list_notifications(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = db.query(NotificationHistory).filter(
        NotificationHistory.user_id == current_user.id
    ).order_by(desc(NotificationHistory.created_at)).offset(
        (page - 1) * limit
    ).limit(limit).all()

    total = db.query(NotificationHistory).filter(
        NotificationHistory.user_id == current_user.id
    ).count()

    unread = db.query(NotificationHistory).filter(
        NotificationHistory.user_id == current_user.id,
        NotificationHistory.is_read == False,
    ).count()

    return {
        "total": total,
        "unread": unread,
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "is_read": n.is_read,
                "reference_type": n.reference_type,
                "reference_id": n.reference_id,
                "created_at": str(n.created_at),
            }
            for n in notifications
        ],
    }


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(NotificationHistory).filter(
        NotificationHistory.id == notification_id,
        NotificationHistory.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(NotificationHistory).filter(
        NotificationHistory.user_id == current_user.id,
        NotificationHistory.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get just the unread count — useful for the bell icon badge."""
    unread = db.query(NotificationHistory).filter(
        NotificationHistory.user_id == current_user.id,
        NotificationHistory.is_read == False,
    ).count()
    return {"unread": unread}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(NotificationHistory).filter(
        NotificationHistory.id == notification_id,
        NotificationHistory.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}
