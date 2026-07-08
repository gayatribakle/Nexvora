"""Verify and fix fines for approved violations"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database.session import SessionLocal
from app.database.models import Violation, Fine, Worker, PenaltyRule, User
from app.services.fine_service import FineService

db = SessionLocal()

def verify_and_fix_fines():
    print("=" * 60)
    print("VERIFYING AND FIXING FINES")
    print("=" * 60)
    
    try:
        # 1. Check all approved violations
        approved_violations = db.query(Violation).filter(
            Violation.status == "approved"
        ).all()
        
        print(f"\nFound {len(approved_violations)} approved violations")
        
        fines_created = 0
        fines_fixed = 0
        
        for violation in approved_violations:
            # Check if fine exists
            existing_fine = db.query(Fine).filter(
                Fine.violation_id == violation.id
            ).first()
            
            if not existing_fine and violation.worker_id:
                # Create fine using FineService
                print(f"\nCreating fine for violation {violation.id} ({violation.violation_type})")
                fine_service = FineService(db)
                fine = fine_service.create_fine(violation.id)
                if fine:
                    fines_created += 1
                    worker = db.query(Worker).filter(Worker.id == violation.worker_id).first()
                    if worker:
                        worker_name = db.query(User).filter(User.id == worker.user_id).first()
                        print(f"  -> Fine Rs.{fine.amount} for {worker_name.full_name if worker_name else 'Unknown'}")
            
            elif existing_fine and violation.worker_id:
                # Verify fine amount matches penalty rule
                rule = db.query(PenaltyRule).filter(
                    PenaltyRule.violation_type == violation.violation_type,
                    PenaltyRule.is_active == True
                ).first()
                
                if rule and existing_fine.amount != rule.base_amount:
                    print(f"\nFixing fine amount for violation {violation.id}")
                    print(f"  -> Was: Rs.{existing_fine.amount}, Should be: Rs.{rule.base_amount}")
                    
                    # Update worker total
                    worker = db.query(Worker).filter(Worker.id == violation.worker_id).first()
                    if worker:
                        worker.total_fine_amount -= existing_fine.amount
                        worker.total_fine_amount += rule.base_amount
                    
                    existing_fine.amount = rule.base_amount
                    fines_fixed += 1
        
        db.commit()
        
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Fines created: {fines_created}")
        print(f"Fines fixed: {fines_fixed}")
        
        # Show statistics
        total_fines = db.query(Fine).count()
        total_amount = db.query(Fine).with_entities(Fine.amount).all()
        total_paid = db.query(Fine).filter(Fine.is_paid == True).count()
        total_pending = db.query(Fine).filter(Fine.is_paid == False).count()
        
        print(f"\nTotal fines: {total_fines}")
        print(f"Total amount: Rs.{sum(f[0] for f in total_amount)}")
        print(f"Paid: {total_paid}")
        print(f"Pending: {total_pending}")
        
        # Show worker statistics
        print("\n" + "=" * 60)
        print("WORKER STATISTICS")
        print("=" * 60)
        
        workers = db.query(Worker).filter(Worker.total_violations > 0).all()
        for worker in workers[:10]:  # Show first 10
            user = db.query(User).filter(User.id == worker.user_id).first()
            print(f"\n{user.full_name if user else 'Unknown'} ({worker.employee_id})")
            print(f"  Violations: {worker.total_violations}")
            print(f"  Fines: {worker.total_fines}")
            print(f"  Fine Amount: Rs.{worker.total_fine_amount}")
            print(f"  Safety Score: {worker.safety_score}")
        
        print("\n" + "=" * 60)
        print("VERIFICATION COMPLETE")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    verify_and_fix_fines()
