import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database.session import get_db
from app.database.models import Violation, Fine, Worker, Alert, SafetyHistory, User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy import text

    sql = text("""
        SELECT
            (SELECT COUNT(*) FROM workers WHERE is_active = 1) AS total_workers,
            (SELECT COUNT(*) FROM violations) AS total_violations,
            (SELECT COUNT(*) FROM violations WHERE status = 'pending') AS pending_violations,
            (SELECT COUNT(*) FROM violations WHERE status = 'approved') AS approved_violations,
            (SELECT COUNT(*) FROM fines) AS total_fines,
            (SELECT COALESCE(SUM(amount), 0) FROM fines) AS total_fine_amount,
            (SELECT COUNT(*) FROM alerts) AS total_alerts,
            (SELECT COUNT(*) FROM alerts WHERE is_read = 0) AS unread_alerts,
            (SELECT COUNT(*) FROM alerts WHERE is_emergency = 1 AND is_read = 0) AS active_emergencies,
            (SELECT COALESCE(AVG(safety_score), 0) FROM workers) AS avg_safety,
            (SELECT COUNT(*) FROM violations WHERE created_at >= :today) AS today_violations
    """)
    today = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    row = db.execute(sql, {"today": today}).fetchone()

    return {
        "total_workers": row[0],
        "total_violations": row[1],
        "pending_violations": row[2],
        "approved_violations": row[3],
        "total_fines": row[4],
        "total_fine_amount": float(row[5]),
        "total_alerts": row[6],
        "unread_alerts": row[7],
        "active_emergencies": row[8],
        "average_safety_score": round(float(row[9]), 1),
        "today_violations": row[10],
    }


@router.get("/violations-by-type")
def violations_by_type(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(Violation.violation_type, func.count(Violation.id)).group_by(Violation.violation_type).all()
    return [{"type": r[0], "count": r[1]} for r in results]


@router.get("/violations-timeline")
def violations_timeline(days: int = 7, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    start_date = datetime.datetime.now() - datetime.timedelta(days=days)
    results = db.query(
        func.date(Violation.created_at).label("date"),
        func.count(Violation.id).label("count"),
    ).filter(Violation.created_at >= start_date).group_by(func.date(Violation.created_at)).order_by("date").all()

    timeline = []
    for i in range(days):
        date = (start_date + datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        count = 0
        for r in results:
            if r.date == date:
                count = r.count
                break
        timeline.append({"date": date, "count": count})

    return timeline


@router.get("/safety-scores")
def safety_scores(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workers = db.query(Worker).filter(Worker.is_active == True).order_by(desc(Worker.safety_score)).limit(20).all()
    return [
        {
            "worker_id": w.id,
            "worker_name": w.user.full_name if w.user else "Unknown",
            "department": w.department,
            "safety_score": w.safety_score,
            "total_violations": w.total_violations,
        }
        for w in workers
    ]


@router.get("/fine-summary")
def fine_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(func.sum(Fine.amount)).scalar() or 0
    paid = db.query(func.sum(Fine.amount)).filter(Fine.is_paid == True).scalar() or 0
    pending = db.query(func.sum(Fine.amount)).filter(Fine.is_paid == False).scalar() or 0

    by_type = db.query(
        Violation.violation_type,
        func.count(Fine.id),
        func.sum(Fine.amount),
    ).join(Fine, Fine.violation_id == Violation.id).group_by(Violation.violation_type).all()

    return {
        "total_amount": float(total),
        "paid_amount": float(paid),
        "pending_amount": float(pending),
        "by_type": [{"type": r[0], "count": r[1], "amount": float(r[2])} for r in by_type],
    }
