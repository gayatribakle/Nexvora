from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.database.models import Training, WorkerTraining, Worker, User
from app.auth.dependencies import get_current_user, require_admin
from app.services.worker_service import WorkerService

router = APIRouter(prefix="/trainings", tags=["Training"])


@router.get("")
def list_trainings(
    department: Optional[str] = None,
    is_mandatory: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Training).filter(Training.is_active == True)
    if department:
        query = query.filter(Training.department == department)
    if is_mandatory is not None:
        query = query.filter(Training.is_mandatory == is_mandatory)

    trainings = query.all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "training_type": t.training_type,
            "duration_minutes": t.duration_minutes,
            "is_mandatory": t.is_mandatory,
        }
        for t in trainings
    ]


@router.post("")
def create_training(
    title: str,
    description: str,
    training_type: str = "video",
    duration_minutes: Optional[int] = None,
    is_mandatory: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    training = Training(
        title=title,
        description=description,
        training_type=training_type,
        duration_minutes=duration_minutes,
        is_mandatory=is_mandatory,
    )
    db.add(training)
    db.commit()
    db.refresh(training)
    return {"message": "Training created", "id": training.id}


@router.post("/{training_id}/complete")
def complete_training(
    training_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Only workers can complete training")

    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    training = db.query(Training).filter(Training.id == training_id).first()
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")

    existing = db.query(WorkerTraining).filter(
        WorkerTraining.worker_id == worker.id,
        WorkerTraining.training_id == training_id,
    ).first()
    if existing:
        return {"message": "Training already completed"}

    wt = WorkerTraining(worker_id=worker.id, training_id=training_id)
    db.add(wt)
    worker.trainings_completed += 1

    worker_svc = WorkerService(db)
    worker_svc.update_safety_score(worker.id, 5, "Training completed")

    db.commit()
    return {"message": "Training completed successfully"}
