from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database.session import get_db
from app.database.models import Worker, User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("")
def get_leaderboard(
    department: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Worker).filter(Worker.is_active == True)
    if department:
        query = query.filter(Worker.department == department)

    workers = query.order_by(desc(Worker.safety_score)).limit(limit).all()

    return [
        {
            "rank": i + 1,
            "worker_id": w.id,
            "worker_name": w.user.full_name if w.user else "Unknown",
            "department": w.department,
            "designation": w.designation,
            "safety_score": w.safety_score,
            "total_violations": w.total_violations,
            "trainings_completed": w.trainings_completed,
            "quizzes_passed": w.quizzes_passed,
        }
        for i, w in enumerate(workers)
    ]
