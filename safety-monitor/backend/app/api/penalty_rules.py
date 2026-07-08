from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.database.models import User, PenaltyRule
from app.auth.dependencies import get_current_user, require_admin, require_safety_officer_or_admin

router = APIRouter(prefix="/penalty-rules", tags=["Penalty Rules"])


class PenaltyRuleCreate(BaseModel):
    violation_type: str
    base_amount: float
    escalation_enabled: bool = False
    escalation_multiplier: float = 1.5
    max_amount: float = 10000.0


class PenaltyRuleUpdate(BaseModel):
    base_amount: Optional[float] = None
    escalation_enabled: Optional[bool] = None
    escalation_multiplier: Optional[float] = None
    max_amount: Optional[float] = None
    is_active: Optional[bool] = None


@router.get("")
def list_penalty_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rules = db.query(PenaltyRule).order_by(PenaltyRule.violation_type).all()
    return [
        {
            "id": r.id,
            "violation_type": r.violation_type,
            "base_amount": r.base_amount,
            "escalation_enabled": r.escalation_enabled,
            "escalation_multiplier": r.escalation_multiplier,
            "max_amount": r.max_amount,
            "is_active": r.is_active,
            "created_at": str(r.created_at),
            "updated_at": str(r.updated_at) if r.updated_at else None,
        }
        for r in rules
    ]


@router.post("")
def create_penalty_rule(
    data: PenaltyRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(PenaltyRule).filter(PenaltyRule.violation_type == data.violation_type).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Penalty rule for '{data.violation_type}' already exists")

    rule = PenaltyRule(
        violation_type=data.violation_type,
        base_amount=data.base_amount,
        escalation_enabled=data.escalation_enabled,
        escalation_multiplier=data.escalation_multiplier,
        max_amount=data.max_amount,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {"id": rule.id, "message": "Penalty rule created", "violation_type": rule.violation_type}


@router.put("/{rule_id}")
def update_penalty_rule(
    rule_id: int,
    data: PenaltyRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rule = db.query(PenaltyRule).filter(PenaltyRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Penalty rule not found")

    if data.base_amount is not None:
        rule.base_amount = data.base_amount
    if data.escalation_enabled is not None:
        rule.escalation_enabled = data.escalation_enabled
    if data.escalation_multiplier is not None:
        rule.escalation_multiplier = data.escalation_multiplier
    if data.max_amount is not None:
        rule.max_amount = data.max_amount
    if data.is_active is not None:
        rule.is_active = data.is_active

    db.commit()
    return {"message": "Penalty rule updated", "id": rule.id}


@router.delete("/{rule_id}")
def delete_penalty_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rule = db.query(PenaltyRule).filter(PenaltyRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Penalty rule not found")

    rule.is_active = False
    db.commit()
    return {"message": "Penalty rule deactivated", "id": rule.id}