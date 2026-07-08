from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database.session import get_db
from app.database.models import (
    Violation, ViolationReviewQueue, Worker, EmployeeEmbedding,
    WorkerImage, User, Fine, UserRole, PhotoType,
)
from app.auth.dependencies import get_current_user, require_safety_officer_or_admin

router = APIRouter(prefix="/safety-officer", tags=["Safety Officer"])


@router.get("/incident-review-queue")
def get_incident_review_queue(
    status: Optional[str] = None,
    confidence_level: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_safety_officer_or_admin),
):
    """Get violations pending review, with optional filters.
    Safety Officers and Admins can access this queue.
    """
    query = db.query(Violation).filter(Violation.needs_review == True)

    if status:
        query = query.filter(Violation.status == status)
    if confidence_level:
        query = query.filter(Violation.confidence_level == confidence_level)

    total = query.count()
    violations = query.order_by(desc(Violation.detected_at)).offset(
        (page - 1) * limit
    ).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "violations": [
            {
                "id": v.id,
                "worker_id": v.worker_id,
                "worker_name": v.worker.user.full_name if v.worker and v.worker.user else "Unknown",
                "camera_id": v.camera_id,
                "violation_type": v.violation_type,
                "status": v.status,
                "confidence": v.confidence,
                "confidence_level": v.confidence_level,
                "face_confidence": v.face_confidence,
                "face_gap": v.face_gap,
                "screenshot_path": v.screenshot_path,
                "detected_at": str(v.detected_at),
                "needs_review": v.needs_review,
                "evidence_files": [
                    {
                        "id": e.id,
                        "evidence_type": e.evidence_type,
                        "file_path": e.file_path,
                        "minio_key": e.minio_key,
                        "description": e.description,
                    }
                    for e in v.evidence_files
                ] if v.evidence_files else [],
            }
            for v in violations
        ],
    }


@router.post("/verify-employee/{violation_id}")
def verify_employee_identity(
    violation_id: int,
    confirmed_worker_id: int = Query(..., description="Worker ID confirmed by Safety Officer"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_safety_officer_or_admin),
):
    """Safety Officer confirms or corrects the worker identity for a violation.
    This is used when face recognition confidence is low (needs_review=True).
    """
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    worker = db.query(Worker).filter(Worker.id == confirmed_worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    old_worker_id = violation.worker_id
    violation.worker_id = confirmed_worker_id
    violation.needs_review = False
    violation.face_confidence = 1.0  # Manually verified
    violation.confidence_level = "HIGH"
    db.commit()

    # Update review queue if exists
    review_entry = db.query(ViolationReviewQueue).filter(
        ViolationReviewQueue.violation_id == violation_id,
        ViolationReviewQueue.status == "pending",
    ).first()
    if review_entry:
        review_entry.status = "approved"
        review_entry.reviewed_by = current_user.id
        from datetime import datetime
        review_entry.reviewed_at = datetime.utcnow()
        review_entry.notes = f"Employee verified by Safety Officer. Changed worker_id from {old_worker_id} to {confirmed_worker_id}"
        db.commit()

    return {
        "message": "Employee identity verified",
        "violation_id": violation_id,
        "confirmed_worker_id": confirmed_worker_id,
        "worker_name": worker.user.full_name if worker.user else "Unknown",
    }


@router.get("/employee-verification/{worker_id}")
def get_employee_verification_data(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_safety_officer_or_admin),
):
    """Get employee photos and embeddings for identity verification.
    Safety Officers use this to compare detected face with registered photos.
    """
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    images = db.query(WorkerImage).filter(WorkerImage.worker_id == worker_id).all()
    embeddings = db.query(EmployeeEmbedding).filter(
        EmployeeEmbedding.worker_id == worker_id
    ).all()

    # Get recent violations for this worker
    violations = db.query(Violation).filter(
        Violation.worker_id == worker_id
    ).order_by(desc(Violation.detected_at)).limit(10).all()

    return {
        "worker": {
            "id": worker.id,
            "employee_id": worker.employee_id,
            "full_name": worker.user.full_name if worker.user else "Unknown",
            "department": worker.department,
            "contractor": worker.contractor,
            "site_assignment": worker.site_assignment,
        },
        "registered_photos": [
            {
                "id": img.id,
                "photo_type": img.photo_type,
                "filepath": img.filepath,
                "is_primary": img.is_primary,
            }
            for img in images
        ],
        "embeddings": [
            {
                "id": emb.id,
                "photo_type": emb.photo_type,
                "model_name": emb.model_name,
                "embedding_dim": emb.embedding_dim,
                "created_at": str(emb.created_at),
            }
            for emb in embeddings
        ],
        "recent_violations": [
            {
                "id": v.id,
                "violation_type": v.violation_type,
                "confidence": v.confidence,
                "confidence_level": v.confidence_level,
                "face_confidence": v.face_confidence,
                "needs_review": v.needs_review,
                "detected_at": str(v.detected_at),
                "status": v.status,
            }
            for v in violations
        ],
    }


@router.get("/unverified-violations")
def get_unverified_violations(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_safety_officer_or_admin),
):
    """Get violations where face was not confirmed (needs_review=True).
    These are candidates for manual employee verification.
    """
    query = db.query(Violation).filter(
        Violation.needs_review == True,
        Violation.status == "pending",
    )

    total = query.count()
    violations = query.order_by(desc(Violation.detected_at)).offset(
        (page - 1) * limit
    ).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "violations": [
            {
                "id": v.id,
                "worker_id": v.worker_id,
                "worker_name": v.worker.user.full_name if v.worker and v.worker.user else "Unknown",
                "camera_id": v.camera_id,
                "violation_type": v.violation_type,
                "confidence": v.confidence,
                "confidence_level": v.confidence_level,
                "face_confidence": v.face_confidence,
                "face_gap": v.face_gap,
                "detected_at": str(v.detected_at),
                "evidence_files": [
                    {
                        "id": e.id,
                        "evidence_type": e.evidence_type,
                        "file_path": e.file_path,
                    }
                    for e in v.evidence_files
                ] if v.evidence_files else [],
            }
            for v in violations
        ],
    }
