import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List

from app.config.settings import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications via SMTP."""

    def __init__(self):
        self.server = settings.SMTP_SERVER
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.use_tls = settings.SMTP_USE_TLS

    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
    ) -> bool:
        """Send an email to one or more recipients."""
        if not self.username or not self.password:
            logger.warning("SMTP credentials not configured, skipping email")
            return False

        if not to_emails:
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = self.from_email
            msg["To"] = ", ".join(to_emails)
            msg["Subject"] = subject

            msg.attach(MIMEText(body, "plain"))
            if html_body:
                msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(self.server, self.port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                server.sendmail(self.from_email, to_emails, msg.as_string())

            logger.info(f"Email sent to {to_emails}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    def send_incident_notification(self, to_emails: List[str], violation_type: str,
                                    worker_name: str, camera_id: int, confidence: float):
        """Send notification for a new incident."""
        subject = f"[Safety Monitor] New Incident: {violation_type.replace('_', ' ').title()}"
        body = f"""
A new safety violation has been detected:

Violation Type: {violation_type.replace('_', ' ').title()}
Worker: {worker_name}
Camera: Camera {camera_id}
Confidence: {confidence:.1%}

Please review this incident in the Safety Monitor dashboard.
"""
        html = f"""
<html><body>
<h2 style="color: #1a237e;">New Safety Incident</h2>
<table style="border-collapse: collapse; width: 100%;">
<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Violation Type</strong></td>
<td style="padding: 8px; border: 1px solid #ddd;">{violation_type.replace('_', ' ').title()}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Worker</strong></td>
<td style="padding: 8px; border: 1px solid #ddd;">{worker_name}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Camera</strong></td>
<td style="padding: 8px; border: 1px solid #ddd;">Camera {camera_id}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Confidence</strong></td>
<td style="padding: 8px; border: 1px solid #ddd;">{confidence:.1%}</td></tr>
</table>
<p>Please review this incident in the Safety Monitor dashboard.</p>
</body></html>
"""
        return self.send_email(to_emails, subject, body, html_body=html)

    def send_fire_alert(self, to_emails: List[str], camera_id: int, confidence: float):
        """Send urgent fire detection alert."""
        subject = "[URGENT] Fire Detected on Construction Site!"
        body = f"""
FIRE DETECTED!

Camera: Camera {camera_id}
Confidence: {confidence:.1%}

This is an emergency alert. Please take immediate action!
"""
        html = f"""
<html><body>
<h2 style="color: red;">FIRE DETECTED!</h2>
<table style="border-collapse: collapse; width: 100%;">
<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Camera</strong></td>
<td style="padding: 8px; border: 1px solid #ddd;">Camera {camera_id}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Confidence</strong></td>
<td style="padding: 8px; border: 1px solid #ddd;">{confidence:.1%}</td></tr>
</table>
<p style="color: red; font-weight: bold;">This is an emergency alert. Please take immediate action!</p>
</body></html>
"""
        return self.send_email(to_emails, subject, body, html_body=html)


# Singleton instance
email_service = EmailService()