from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database.session import get_db
from app.database.models import Violation, ViolationReviewQueue, User, Worker
from app.auth.dependencies import get_current_user, require_admin, require_safety_officer_or_admin, require_supervisor_or_above
from app.services.violation_service import ViolationService
from app.services.fine_service import FineService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/violations", tags=["Violations"])


@router.get("")
def list_violations(
    status: Optional[str] = None,
    violation_type: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # If user is a worker, only show their own violations (data isolation)
    if current_user.role == "worker":
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker:
            return {
                "total": 0,
                "page": page,
                "limit": limit,
                "violations": [],
            }
        query = db.query(Violation).filter(Violation.worker_id == worker.id)
    else:
        # Admin/Safety Officer/Supervisor can see all violations
        query = db.query(Violation)
    
    if status:
        query = query.filter(Violation.status == status)
    if violation_type:
        query = query.filter(Violation.violation_type == violation_type)

    total = query.count()
    violations = query.order_by(desc(Violation.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "violations": [
            {
                "id": v.id,
                "worker_id": v.worker_id,
                "worker_name": v.worker.user.full_name if v.worker and v.worker.user else "Unknown",
                "worker_employee_id": v.worker.employee_id if v.worker else None,
                "camera_id": v.camera_id,
                "violation_type": v.violation_type,
                "status": v.status,
                "confidence": v.confidence,
                "evidence_path": v.evidence_path,
                "screenshot_path": v.screenshot_path,
                "description": v.description,
                "detected_at": str(v.detected_at),
                "reviewed_at": str(v.reviewed_at) if v.reviewed_at else None,
                "needs_review": v.needs_review,
                "confidence_level": v.confidence_level,
                "face_confidence": v.face_confidence,
                "face_gap": v.face_gap,
                "fine_amount": v.fine.amount if v.fine else 0,
                "fine_id": v.fine.id if v.fine else None,
                "fine_is_paid": v.fine.is_paid if v.fine else None,
            }
            for v in violations
        ],
    }


@router.get("/review-queue")
def get_review_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_safety_officer_or_admin),
):
    queue = db.query(ViolationReviewQueue).filter(
        ViolationReviewQueue.status == "pending"
    ).order_by(desc(ViolationReviewQueue.created_at)).all()

    return [
        {
            "id": q.id,
            "violation_id": q.violation_id,
            "violation_type": q.violation.violation_type if q.violation else None,
            "worker_name": q.violation.worker.user.full_name if q.violation and q.violation.worker and q.violation.worker.user else "Unknown",
            "confidence": q.violation.confidence if q.violation else None,
            "screenshot_path": q.violation.screenshot_path if q.violation else None,
            "detected_at": str(q.violation.detected_at) if q.violation else None,
            "created_at": str(q.created_at),
            "needs_review": q.violation.needs_review if q.violation else False,
            "confidence_level": q.violation.confidence_level if q.violation else None,
        }
        for q in queue
    ]


@router.post("/{violation_id}/approve")
def approve_violation(
    violation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_safety_officer_or_admin),
):
    svc = ViolationService(db)
    violation = svc.approve_violation(violation_id, current_user.id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    fine_svc = FineService(db)
    fine = fine_svc.create_fine(violation_id)

    if violation.worker_id and violation.worker and violation.worker.user_id:
        notif_svc = NotificationService(db)
        violation_type_display = violation.violation_type.replace('_', ' ').title()
        notif_svc.send_notification(
            user_id=violation.worker.user_id,
            title=f"Violation Approved: {violation_type_display}",
            message=(
                f"Your {violation_type_display} violation has been reviewed and approved.\n"
                f"Fine Amount: ₹{fine.amount if fine else 0}\n"
                f"Please pay the fine to clear this record."
            ),
            notification_type="violation_approved",
            reference_type="violation",
            reference_id=violation_id,
        )

    return {"message": "Violation approved", "fine_amount": fine.amount if fine else 0}


@router.post("/{violation_id}/reject")
def reject_violation(
    violation_id: int,
    reason: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_safety_officer_or_admin),
):
    svc = ViolationService(db)
    violation = svc.reject_violation(violation_id, current_user.id, reason)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    # Notify the worker that their violation has been rejected/dismissed
    if violation.worker_id and violation.worker and violation.worker.user_id:
        notif_svc = NotificationService(db)
        violation_type_display = violation.violation_type.replace('_', ' ').title()
        notif_svc.send_notification(
            user_id=violation.worker.user_id,
            title=f"Violation Dismissed: {violation_type_display}",
            message=(
                f"Your {violation_type_display} violation has been reviewed and dismissed.\n"
                f"Reason: {reason}\n"
                f"No fine will be applied for this incident."
            ),
            notification_type="violation_rejected",
            reference_type="violation",
            reference_id=violation_id,
        )

    return {"message": "Violation rejected"}


@router.delete("/{violation_id}")
def delete_violation(
    violation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    svc = ViolationService(db)
    if not svc.delete_violation(violation_id):
        raise HTTPException(status_code=404, detail="Violation not found")
    return {"message": "Violation deleted"}
