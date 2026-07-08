import logging
from sqlalchemy.orm import Session
from typing import Optional, List
import datetime

from app.database.models import NotificationHistory, User, UserRole
from app.websocket.ws_manager import ws_manager
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def send_notification(self, user_id: int, title: str, message: str,
                          notification_type: str = "in_app",
                          reference_type: Optional[str] = None,
                          reference_id: Optional[int] = None):
        notif = NotificationHistory(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            reference_type=reference_type,
            reference_id=reference_id,
        )
        self.db.add(notif)
        self.db.commit()

        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.ensure_future(ws_manager.broadcast("alerts", {
                        "type": "notification",
                        "user_id": user_id,
                        "title": title,
                        "message": message,
                    }))
            except RuntimeError:
                pass

        return notif

    def _get_users_by_roles(self, roles: List[str]) -> List[User]:
        """Get all active users matching given roles."""
        return self.db.query(User).filter(
            User.role.in_(roles),
            User.is_active == True,
        ).all()

    def _get_emails_for_roles(self, roles: List[str]) -> List[str]:
        """Get email addresses of all active users matching given roles."""
        users = self._get_users_by_roles(roles)
        return [u.email for u in users if u.email]

    def notify_new_incident(self, violation_type: str, worker_name: str,
                            camera_id: int, confidence: float,
                            violation_id: Optional[int] = None):
        """Notify Safety Officer + Supervisor of a new incident."""
        title = f"New Incident: {violation_type.replace('_', ' ').title()}"
        message = (
            f"Violation: {violation_type.replace('_', ' ').title()}\n"
            f"Worker: {worker_name}\n"
            f"Camera: Camera {camera_id}\n"
            f"Confidence: {confidence:.1%}"
        )

        # Notify Safety Officers and Supervisors via in-app
        target_roles = [UserRole.SAFETY_OFFICER.value, UserRole.SUPERVISOR.value]
        users = self._get_users_by_roles(target_roles)
        for user in users:
            self.send_notification(
                user_id=user.id,
                title=title,
                message=message,
                notification_type="incident",
                reference_type="violation",
                reference_id=violation_id,
            )

        # Send email notification
        emails = self._get_emails_for_roles(target_roles)
        if emails:
            email_service.send_incident_notification(
                to_emails=emails,
                violation_type=violation_type,
                worker_name=worker_name,
                camera_id=camera_id,
                confidence=confidence,
            )

        # Broadcast alert via WebSocket
        self.broadcast_alert(title, message, severity="yellow")

    def notify_high_severity(self, violation_type: str, worker_name: str,
                             camera_id: int, confidence: float,
                             violation_id: Optional[int] = None):
        """Notify Admin + Safety Officer of high-severity incidents."""
        title = f"[HIGH SEVERITY] {violation_type.replace('_', ' ').title()}"
        message = (
            f"HIGH SEVERITY ALERT\n"
            f"Violation: {violation_type.replace('_', ' ').title()}\n"
            f"Worker: {worker_name}\n"
            f"Camera: Camera {camera_id}\n"
            f"Confidence: {confidence:.1%}"
        )

        # Notify Admins and Safety Officers via in-app
        target_roles = [UserRole.ADMIN.value, UserRole.SAFETY_OFFICER.value]
        users = self._get_users_by_roles(target_roles)
        for user in users:
            self.send_notification(
                user_id=user.id,
                title=title,
                message=message,
                notification_type="high_severity",
                reference_type="violation",
                reference_id=violation_id,
            )

        # Send email notification
        emails = self._get_emails_for_roles(target_roles)
        if emails:
            email_service.send_incident_notification(
                to_emails=emails,
                violation_type=violation_type,
                worker_name=worker_name,
                camera_id=camera_id,
                confidence=confidence,
            )

        # Broadcast alert via WebSocket with orange severity
        self.broadcast_alert(title, message, severity="orange")

    def notify_fire_detection(self, camera_id: int, confidence: float,
                              violation_id: Optional[int] = None):
        """Emergency fire alert - notify ALL roles, mark as emergency."""
        title = "[EMERGENCY] Fire Detected!"
        message = (
            f"FIRE DETECTED!\n"
            f"Camera: Camera {camera_id}\n"
            f"Confidence: {confidence:.1%}\n"
            f"TAKE IMMEDIATE ACTION!"
        )

        # Notify ALL active users via in-app
        all_roles = [r.value for r in UserRole]
        users = self._get_users_by_roles(all_roles)
        for user in users:
            self.send_notification(
                user_id=user.id,
                title=title,
                message=message,
                notification_type="emergency",
                reference_type="violation",
                reference_id=violation_id,
            )

        # Send urgent email to all users
        emails = self._get_emails_for_roles(all_roles)
        if emails:
            email_service.send_fire_alert(
                to_emails=emails,
                camera_id=camera_id,
                confidence=confidence,
            )

        # Broadcast emergency alert via WebSocket with red severity
        self.broadcast_alert(title, message, severity="red")

    def broadcast_alert(self, title: str, message: str, severity: str = "yellow"):
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(ws_manager.broadcast("alerts", {
                    "type": "alert",
                    "title": title,
                    "message": message,
                    "severity": severity,
                    "timestamp": str(datetime.datetime.utcnow()),
                }))
                asyncio.ensure_future(ws_manager.broadcast("monitoring", {
                    "type": "alert",
                    "title": title,
                    "message": message,
                    "severity": severity,
                }))
        except RuntimeError:
            pass

    def send_sms(self, phone: str, message: str):
        print(f"[SMS SIMULATION] To: {phone}, Message: {message}")

    def send_email(self, email: str, subject: str, body: str):
        """Send a simple email using the EmailService."""
        email_service.send_email([email], subject, body)

    # ─── Worker-specific notification helpers ──────────────────────────────────

    def notify_worker_violation_recorded(self, worker, violation_type: str, violation_id: int):
        """Notify a worker that a new violation has been recorded for them."""
        violation_type_display = violation_type.replace('_', ' ').title()
        return self.send_notification(
            user_id=worker.user_id,
            title=f"New Violation: {violation_type_display}",
            message=f"A {violation_type_display} violation has been recorded for you. It is pending review.",
            notification_type="violation",
            reference_type="violation",
            reference_id=violation_id,
        )

    def notify_worker_violation_approved(self, worker, violation_type: str, violation_id: int, fine_amount: float):
        """Notify a worker that their violation has been approved and a fine issued."""
        violation_type_display = violation_type.replace('_', ' ').title()
        return self.send_notification(
            user_id=worker.user_id,
            title=f"Violation Approved: {violation_type_display}",
            message=(
                f"Your {violation_type_display} violation has been reviewed and approved.\n"
                f"Fine Amount: ₹{fine_amount}\n"
                f"Please pay the fine to clear this record."
            ),
            notification_type="violation_approved",
            reference_type="violation",
            reference_id=violation_id,
        )

    def notify_worker_violation_rejected(self, worker, violation_type: str, violation_id: int, reason: str):
        """Notify a worker that their violation has been dismissed."""
        violation_type_display = violation_type.replace('_', ' ').title()
        return self.send_notification(
            user_id=worker.user_id,
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

    def notify_worker_fine_paid(self, worker, fine_amount: float, violation_type: str, fine_id: int):
        """Notify a worker that their fine has been paid."""
        violation_type_display = violation_type.replace('_', ' ').title()
        return self.send_notification(
            user_id=worker.user_id,
            title=f"Fine Paid: ₹{fine_amount}",
            message=(
                f"Your fine of ₹{fine_amount} for {violation_type_display} violation has been marked as paid.\n"
                f"Thank you for clearing this record."
            ),
            notification_type="fine_paid",
            reference_type="fine",
            reference_id=fine_id,
        )

    def notify_worker_fine_adjusted(self, worker, new_amount: float, reason: str, fine_id: int):
        """Notify a worker that their fine has been adjusted."""
        return self.send_notification(
            user_id=worker.user_id,
            title=f"Fine Adjusted: ₹{new_amount}",
            message=(
                f"Your fine has been adjusted to ₹{new_amount}.\n"
                f"Reason: {reason}"
            ),
            notification_type="fine_adjusted",
            reference_type="fine",
            reference_id=fine_id,
        )

    def notify_worker_safety_score(self, worker, score_before: int, score_after: int, change: int, reason: str):
        """Notify a worker about their safety score change."""
        if change < 0:
            return self.send_notification(
                user_id=worker.user_id,
                title=f"Safety Score Decreased: {score_before} → {score_after}",
                message=(
                    f"Your safety score has been reduced by {abs(change)} points.\n"
                    f"Reason: {reason}\n"
                    f"Current Score: {score_after}/100\n"
                    f"Please follow safety guidelines to improve your score."
                ),
                notification_type="safety_score_decrease",
                reference_type="worker",
                reference_id=worker.id,
            )
        elif change > 0:
            return self.send_notification(
                user_id=worker.user_id,
                title=f"Safety Score Improved: {score_before} → {score_after}",
                message=(
                    f"Your safety score has increased by {change} points.\n"
                    f"Reason: {reason}\n"
                    f"Current Score: {score_after}/100\n"
                    f"Keep up the good work!"
                ),
                notification_type="safety_score_increase",
                reference_type="worker",
                reference_id=worker.id,
            )
