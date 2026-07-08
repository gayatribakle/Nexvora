import os
import datetime
from sqlalchemy.orm import Session
from typing import Optional

from app.database.models import User, Worker, WorkerImage, SafetyHistory, SystemLog
from app.auth.security import get_password_hash


class WorkerService:
    def __init__(self, db: Session):
        self.db = db

    def create_worker(self, data: dict) -> Worker:
        user = User(
            username=data["username"],
            email=data["email"],
            hashed_password=get_password_hash(data["password"]),
            full_name=data["full_name"],
            role=data.get("role", "worker"),
        )
        self.db.add(user)
        self.db.flush()

        worker = Worker(
            user_id=user.id,
            employee_id=data["employee_id"],
            phone=data.get("phone"),
            department=data.get("department"),
            designation=data.get("designation"),
            contractor=data.get("contractor"),
            safety_score=100,
        )
        self.db.add(worker)
        self.db.flush()

        log = SystemLog(action="create_worker", entity_type="worker", entity_id=worker.id, details=f"Worker {data['full_name']} created")
        self.db.add(log)
        self.db.commit()
        self.db.refresh(worker)
        return worker

    def update_safety_score(self, worker_id: int, change: int, reason: str):
        worker = self.db.query(Worker).filter(Worker.id == worker_id).first()
        if not worker:
            return

        score_before = worker.safety_score
        worker.safety_score = max(0, min(100, worker.safety_score + change))
        worker.updated_at = datetime.datetime.utcnow()

        history = SafetyHistory(
            worker_id=worker_id,
            score_before=score_before,
            score_after=worker.safety_score,
            change_reason=reason,
            change_amount=change,
        )
        self.db.add(history)
        self.db.commit()

        # Notify the worker about their safety score change
        if worker.user_id:
            try:
                from app.services.notification_service import NotificationService
                notif_svc = NotificationService(self.db)
                if change < 0:
                    notif_svc.send_notification(
                        user_id=worker.user_id,
                        title=f"Safety Score Decreased: {score_before} → {worker.safety_score}",
                        message=(
                            f"Your safety score has been reduced by {abs(change)} points.\n"
                            f"Reason: {reason}\n"
                            f"Current Score: {worker.safety_score}/100\n"
                            f"Please follow safety guidelines to improve your score."
                        ),
                        notification_type="safety_score_decrease",
                        reference_type="worker",
                        reference_id=worker.id,
                    )
                elif change > 0:
                    notif_svc.send_notification(
                        user_id=worker.user_id,
                        title=f"Safety Score Improved: {score_before} → {worker.safety_score}",
                        message=(
                            f"Your safety score has increased by {change} points.\n"
                            f"Reason: {reason}\n"
                            f"Current Score: {worker.safety_score}/100\n"
                            f"Keep up the good work!"
                        ),
                        notification_type="safety_score_increase",
                        reference_type="worker",
                        reference_id=worker.id,
                    )
            except Exception as e:
                print(f"Failed to send safety score notification: {e}")

    def upload_worker_image(self, worker_id: int, filename: str, filepath: str, is_primary: bool = True, photo_type: str = "front_face"):
        if is_primary:
            self.db.query(WorkerImage).filter(
                WorkerImage.worker_id == worker_id
            ).update({"is_primary": False})

        img = WorkerImage(
            worker_id=worker_id,
            filename=filename,
            filepath=filepath,
            is_primary=is_primary,
            photo_type=photo_type,
        )
        self.db.add(img)
        self.db.commit()
        return img

    def get_worker_by_user_id(self, user_id: int) -> Optional[Worker]:
        return self.db.query(Worker).filter(Worker.user_id == user_id).first()

    def get_worker_detail(self, worker_id: int) -> Optional[Worker]:
        return self.db.query(Worker).filter(Worker.id == worker_id).first()
