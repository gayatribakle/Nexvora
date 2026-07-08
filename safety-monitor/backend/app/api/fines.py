from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database.session import get_db
from app.database.models import Fine, User, Worker
from app.auth.dependencies import get_current_user, require_admin, require_safety_officer_or_admin, require_supervisor_or_above
from app.services.fine_service import FineService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/fines", tags=["Fines"])


@router.get("")
def list_fines(
    is_paid: Optional[bool] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Fine)
    if is_paid is not None:
        query = query.filter(Fine.is_paid == is_paid)

    total = query.count()
    fines = query.order_by(desc(Fine.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "fines": [
            {
                "id": f.id,
                "worker_id": f.worker_id,
                "worker_name": f.worker.user.full_name if f.worker and f.worker.user else "Unknown",
                "violation_type": f.violation.violation_type if f.violation else "Unknown",
                "amount": f.amount,
                "description": f.description,
                "is_paid": f.is_paid,
                "paid_at": str(f.paid_at) if f.paid_at else None,
                "created_at": str(f.created_at),
            }
            for f in fines
        ],
    }


@router.post("/{fine_id}/pay")
def pay_fine(fine_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = FineService(db)
    fine = svc.pay_fine(fine_id)
    if not fine:
        raise HTTPException(status_code=404, detail="Fine not found or already paid")

    # Notify the worker that their fine has been paid
    if fine.worker_id:
        worker = db.query(Worker).filter(Worker.id == fine.worker_id).first()
        if worker and worker.user_id:
            notif_svc = NotificationService(db)
            violation_type = fine.violation.violation_type.replace('_', ' ').title() if fine.violation else "Unknown"
            notif_svc.send_notification(
                user_id=worker.user_id,
                title=f"Fine Paid: ₹{fine.amount}",
                message=(
                    f"Your fine of ₹{fine.amount} for {violation_type} violation has been marked as paid.\n"
                    f"Thank you for clearing this record."
                ),
                notification_type="fine_paid",
                reference_type="fine",
                reference_id=fine.id,
            )

    return {"message": "Fine paid successfully"}


@router.get("/summary")
def fine_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_fines = db.query(Fine).count()
    total_amount = db.query(Fine).with_entities(Fine.amount).all()
    total_paid = db.query(Fine).filter(Fine.is_paid == True).count()
    total_pending = db.query(Fine).filter(Fine.is_paid == False).count()

    return {
        "total_fines": total_fines,
        "total_amount": sum(f.amount for f in total_amount),
        "total_paid": total_paid,
        "total_pending": total_pending,
    }


@router.delete("/{fine_id}")
def delete_fine(fine_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    fine = db.query(Fine).filter(Fine.id == fine_id).first()
    if not fine:
        raise HTTPException(status_code=404, detail="Fine not found")
    db.delete(fine)
    db.commit()
    return {"message": "Fine deleted"}


@router.put("/{fine_id}/adjust")
def adjust_fine(
    fine_id: int,
    adjusted_amount: float = Body(..., embed=True),
    reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_safety_officer_or_admin),
):
    """Manually adjust a fine amount."""
    if adjusted_amount < 0:
        raise HTTPException(status_code=400, detail="Adjusted amount cannot be negative")
    if not reason or len(reason.strip()) < 3:
        raise HTTPException(status_code=400, detail="Reason must be at least 3 characters")

    svc = FineService(db)
    fine = svc.adjust_fine(fine_id, adjusted_amount, reason)
    if not fine:
        raise HTTPException(status_code=404, detail="Fine not found")

    # Notify the worker that their fine has been adjusted
    if fine.worker_id:
        worker = db.query(Worker).filter(Worker.id == fine.worker_id).first()
        if worker and worker.user_id:
            notif_svc = NotificationService(db)
            notif_svc.send_notification(
                user_id=worker.user_id,
                title=f"Fine Adjusted: ₹{adjusted_amount}",
                message=(
                    f"Your fine has been adjusted to ₹{adjusted_amount}.\n"
                    f"Reason: {reason}"
                ),
                notification_type="fine_adjusted",
                reference_type="fine",
                reference_id=fine.id,
            )

    return {
        "message": "Fine adjusted",
        "id": fine.id,
        "old_amount": fine.adjusted_amount if fine.adjusted_amount else fine.amount,
        "new_amount": fine.amount,
        "reason": reason,
    }
