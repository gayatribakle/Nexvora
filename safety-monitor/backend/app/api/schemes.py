from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.database.models import Scheme, WorkerScheme, Worker, User
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/schemes", tags=["Government Schemes"])


@router.get("")
def list_schemes(
    department: Optional[str] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Scheme)
    if department:
        query = query.filter(Scheme.department == department)
    if is_active is not None:
        query = query.filter(Scheme.is_active == is_active)

    schemes = query.all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "benefits": s.benefits,
            "eligibility": s.eligibility,
            "department": s.department,
            "is_active": s.is_active,
        }
        for s in schemes
    ]


@router.post("")
def create_scheme(
    name: str,
    description: str,
    benefits: str,
    eligibility: str,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    scheme = Scheme(
        name=name,
        description=description,
        benefits=benefits,
        eligibility=eligibility,
        department=department,
    )
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return {"message": "Scheme created", "id": scheme.id}


@router.put("/{scheme_id}")
def update_scheme(
    scheme_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    benefits: Optional[str] = None,
    eligibility: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    if name:
        scheme.name = name
    if description:
        scheme.description = description
    if benefits:
        scheme.benefits = benefits
    if eligibility:
        scheme.eligibility = eligibility
    if is_active is not None:
        scheme.is_active = is_active

    db.commit()
    return {"message": "Scheme updated"}


@router.delete("/{scheme_id}")
def delete_scheme(scheme_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    db.delete(scheme)
    db.commit()
    return {"message": "Scheme deleted"}


@router.post("/assign")
def assign_scheme(
    worker_id: int,
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    existing = db.query(WorkerScheme).filter(
        WorkerScheme.worker_id == worker_id,
        WorkerScheme.scheme_id == scheme_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Scheme already assigned")

    ws = WorkerScheme(worker_id=worker_id, scheme_id=scheme_id)
    db.add(ws)
    db.commit()
    return {"message": "Scheme assigned to worker"}


@router.post("/enroll")
def self_enroll_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Worker self-enrolls in a government scheme."""
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Only workers can self-enroll")

    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    if not scheme.is_active:
        raise HTTPException(status_code=400, detail="Scheme is not active")

    existing = db.query(WorkerScheme).filter(
        WorkerScheme.worker_id == worker.id,
        WorkerScheme.scheme_id == scheme_id,
    ).first()
    if existing:
        if existing.is_enrolled:
            raise HTTPException(status_code=400, detail="Already enrolled in this scheme")
        existing.is_enrolled = True
        db.commit()
        return {"message": "Re-enrolled in scheme", "id": scheme.id, "name": scheme.name}

    ws = WorkerScheme(worker_id=worker.id, scheme_id=scheme_id, is_enrolled=True)
    db.add(ws)
    db.commit()
    return {"message": "Enrolled in scheme", "id": scheme.id, "name": scheme.name}


@router.post("/unenroll")
def self_unenroll_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Worker un-enrolls from a government scheme."""
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Only workers can un-enroll")

    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    ws = db.query(WorkerScheme).filter(
        WorkerScheme.worker_id == worker.id,
        WorkerScheme.scheme_id == scheme_id,
    ).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Not enrolled in this scheme")

    ws.is_enrolled = False
    db.commit()
    return {"message": "Un-enrolled from scheme", "id": scheme_id}


@router.get("/available")
def list_available_schemes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all active schemes with current worker's enrollment status."""
    schemes = db.query(Scheme).filter(Scheme.is_active == True).all()

    worker = None
    if current_user.role == "worker":
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()

    enrolled_ids = set()
    if worker:
        enrolled_ids = {
            ws.scheme_id
            for ws in db.query(WorkerScheme).filter(
                WorkerScheme.worker_id == worker.id,
                WorkerScheme.is_enrolled == True,
            ).all()
        }

    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "benefits": s.benefits,
            "eligibility": s.eligibility,
            "department": s.department,
            "is_enrolled": s.id in enrolled_ids,
            "is_active": s.is_active,
        }
        for s in schemes
    ]


@router.get("/worker/{worker_id}")
def get_worker_schemes(worker_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    return [
        {
            "id": ws.scheme.id,
            "name": ws.scheme.name,
            "description": ws.scheme.description,
            "benefits": ws.scheme.benefits,
            "department": ws.scheme.department,
            "enrolled_at": str(ws.enrolled_at),
        }
        for ws in worker.schemes if ws.is_enrolled
    ]
