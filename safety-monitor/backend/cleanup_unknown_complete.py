"""
Complete Database Cleanup - Remove All Unknown Person Entries
Removes all violations, alerts, and related data for unknown persons (worker_id = NULL)
"""
import sys
import os
from pathlib import Path

backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from app.database.session import SessionLocal
from app.database.models import (
    Violation, Evidence, Alert, Fine, 
    NotificationHistory, ViolationReviewQueue, 
    SystemLog
)

def cleanup_unknown_persons():
    """Delete all unknown person entries from database"""
    print("\n" + "="*80)
    print("DATABASE CLEANUP: Remove All Unknown Person Entries")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Find all violations with no worker_id (unknown persons)
        unknown_violations = db.query(Violation).filter(
            Violation.worker_id == None
        ).all()
        
        print(f"\n🔍 Found {len(unknown_violations)} violations for unknown persons")
        
        # Track deletions
        deletion_stats = {
            "violations": 0,
            "evidence": 0,
            "alerts": 0,
            "fines": 0,
            "notifications": 0,
            "review_queue": 0,
            "system_logs": 0,
        }
        
        # For each unknown violation, delete related records
        for violation in unknown_violations:
            print(f"\n📋 Processing violation ID {violation.id}:")
            
            # 1. Delete evidence records
            evidence_records = db.query(Evidence).filter(
                Evidence.violation_id == violation.id
            ).all()
            for ev in evidence_records:
                print(f"   ❌ Evidence #{ev.id} deleted")
                db.delete(ev)
                deletion_stats["evidence"] += 1
            
            # 2. Delete alerts
            alerts = db.query(Alert).filter(
                Alert.fingerprint == violation.fingerprint
            ).all()
            for alert in alerts:
                print(f"   ❌ Alert #{alert.id} deleted")
                db.delete(alert)
                deletion_stats["alerts"] += 1
            
            # 3. Delete fines
            fines = db.query(Fine).filter(
                Fine.violation_id == violation.id
            ).all()
            for fine in fines:
                print(f"   ❌ Fine #{fine.id} deleted")
                db.delete(fine)
                deletion_stats["fines"] += 1
            
            # 4. Delete notifications
            notifications = db.query(NotificationHistory).filter(
                NotificationHistory.reference_type == "violation",
                NotificationHistory.reference_id == violation.id
            ).all()
            for notif in notifications:
                print(f"   ❌ Notification #{notif.id} deleted")
                db.delete(notif)
                deletion_stats["notifications"] += 1
            
            # 5. Delete violation review queue
            review_queues = db.query(ViolationReviewQueue).filter(
                ViolationReviewQueue.violation_id == violation.id
            ).all()
            for rq in review_queues:
                print(f"   ❌ Review Queue #{rq.id} deleted")
                db.delete(rq)
                deletion_stats["review_queue"] += 1
            
            # 6. Finally, delete the violation itself
            print(f"   ❌ Violation #{violation.id} deleted")
            db.delete(violation)
            deletion_stats["violations"] += 1
        
        # Also delete orphaned alerts for "Unknown" workers
        print(f"\n🔍 Checking for orphaned alerts (worker_name = 'Unknown')...")
        unknown_alerts = db.query(Alert).filter(
            Alert.worker_name == "Unknown"
        ).all()
        
        orphaned_count = 0
        for alert in unknown_alerts:
            print(f"   ❌ Orphaned alert #{alert.id} deleted")
            db.delete(alert)
            deletion_stats["alerts"] += 1
            orphaned_count += 1
        
        if orphaned_count == 0:
            print("   ✅ No orphaned alerts found")
        
        # Commit all deletions
        db.commit()
        
        # Print summary
        print("\n" + "="*80)
        print("📊 CLEANUP SUMMARY:")
        print("="*80)
        total_deleted = sum(deletion_stats.values())
        
        for table, count in deletion_stats.items():
            if count > 0:
                print(f"  • {table:<20}: {count:>4} records deleted")
        
        print(f"\n  {'TOTAL':<20}: {total_deleted:>4} records deleted")
        print("\n✅ Database cleanup completed successfully!")
        print("="*80 + "\n")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = cleanup_unknown_persons()
    exit(0 if success else 1)
