import datetime
from sqlalchemy.orm import Session
from typing import Optional

from app.database.models import Fine, Violation, Worker, SystemLog, PenaltyRule
from app.config.settings import settings


class FineService:
    def __init__(self, db: Session):
        self.db = db

    def calculate_fine(self, worker_id: int, violation_type: str) -> float:
        """Calculate fine amount using database penalty rules with escalation."""
        # Look up penalty rule from database
        rule = self.db.query(PenaltyRule).filter(
            PenaltyRule.violation_type == violation_type,
            PenaltyRule.is_active == True,
        ).first()

        if rule:
            base_amount = rule.base_amount

            # Apply escalation for repeat offenders
            if rule.escalation_enabled:
                # Count previous approved violations of the same type for this worker
                previous_count = self.db.query(Violation).join(Fine).filter(
                    Violation.worker_id == worker_id,
                    Violation.violation_type == violation_type,
                    Violation.status == "approved",
                ).count()

                if previous_count > 0:
                    # Apply escalation multiplier for each previous offense
                    escalated = base_amount * (rule.escalation_multiplier ** min(previous_count, 5))
                    amount = min(escalated, rule.max_amount)
                else:
                    amount = base_amount
            else:
                amount = base_amount
        else:
            # Fallback to settings-based amounts
            amount = 0.0
            if violation_type in ("no_hardhat", "no_safety_vest", "no_mask", "ppe_violation"):
                amount = settings.FINE_PPE_VIOLATION
            elif violation_type == "smoking":
                amount = settings.FINE_SMOKING
            elif violation_type == "fire":
                amount = 2000.0

            # Same-day repeat fine
            today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            today_fines = self.db.query(Fine).join(Violation).filter(
                Violation.worker_id == worker_id,
                Fine.created_at >= today_start,
            ).count()

            if today_fines > 1:
                amount += settings.FINE_MULTIPLE_SAME_DAY

        return amount

    def create_fine(self, violation_id: int) -> Optional[Fine]:
        violation = self.db.query(Violation).filter(Violation.id == violation_id).first()
        if not violation or not violation.worker_id:
            return None

        existing = self.db.query(Fine).filter(Fine.violation_id == violation_id).first()
        if existing:
            return existing

        amount = self.calculate_fine(violation.worker_id, violation.violation_type)

        fine = Fine(
            worker_id=violation.worker_id,
            violation_id=violation_id,
            amount=amount,
            description=f"Fine for {violation.violation_type} violation",
        )
        self.db.add(fine)
        self.db.flush()

        worker = self.db.query(Worker).filter(Worker.id == violation.worker_id).first()
        if worker:
            worker.total_fines += 1
            worker.total_fine_amount += amount

        log = SystemLog(
            action="fine_created",
            entity_type="fine",
            entity_id=fine.id,
            details=f"Fine ₹{amount} for violation {violation_id}",
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(fine)
        return fine

    def adjust_fine(self, fine_id: int, adjusted_amount: float, reason: str) -> Optional[Fine]:
        """Manually adjust a fine amount."""
        fine = self.db.query(Fine).filter(Fine.id == fine_id).first()
        if not fine:
            return None

        old_amount = fine.amount
        fine.adjusted_amount = adjusted_amount
        fine.amount = adjusted_amount
        fine.adjustment_reason = reason
        fine.description = f"{fine.description or ''} [Adjusted from ₹{old_amount} to ₹{adjusted_amount}: {reason}]"

        # Update worker total
        worker = self.db.query(Worker).filter(Worker.id == fine.worker_id).first()
        if worker:
            worker.total_fine_amount += (adjusted_amount - old_amount)

        log = SystemLog(
            action="fine_adjusted",
            entity_type="fine",
            entity_id=fine.id,
            details=f"Fine adjusted from ₹{old_amount} to ₹{adjusted_amount}: {reason}",
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(fine)
        return fine

    def pay_fine(self, fine_id: int) -> Optional[Fine]:
        fine = self.db.query(Fine).filter(Fine.id == fine_id).first()
        if not fine or fine.is_paid:
            return None

        fine.is_paid = True
        fine.paid_at = datetime.datetime.utcnow()
        self.db.commit()
        self.db.refresh(fine)
        return fine