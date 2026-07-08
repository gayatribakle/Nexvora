"""
Cleanup Notifications for Unknown Persons
Removes all notification records created for unknown/unidentified people
"""
import sys
import os
from pathlib import Path

backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from app.database.session import SessionLocal
from app.database.models import NotificationHistory, Violation, Alert

def cleanup_unknown_person_notifications():
    """Delete all notifications created for unknown persons"""
    print("\n" + "="*80)
    print("CLEANUP: Remove Notifications for Unknown Persons")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Find violations with no worker_id (unknown persons)
        unknown_violations = db.query(Violation).filter(
            Violation.worker_id == None
        ).all()
        
        print(f"\n🔍 Found {len(unknown_violations)} violations for unknown persons")
        
        # Find and delete notifications for these violations
        deleted_count = 0
        for violation in unknown_violations:
            # Find notifications referencing this violation
            notifications = db.query(NotificationHistory).filter(
                NotificationHistory.reference_type == "violation",
                NotificationHistory.reference_id == violation.id
            ).all()
            
            for notif in notifications:
                print(f"  ❌ Deleting notification {notif.id} for unknown person violation {violation.id}")
                db.delete(notif)
                deleted_count += 1
        
        # Also delete alerts for unknown person violations
        unknown_alerts = db.query(Alert).filter(
            Alert.worker_name == "Unknown"
        ).all()
        
        print(f"\n🔍 Found {len(unknown_alerts)} alerts for unknown persons")
        alert_deleted = 0
        for alert in unknown_alerts:
            # Only delete if not emergency (fire)
            if not alert.is_emergency:
                print(f"  ❌ Deleting alert {alert.id} for unknown person")
                db.delete(alert)
                alert_deleted += 1
        
        # Commit all deletions
        db.commit()
        
        print(f"\n📊 Cleanup Summary:")
        print(f"  • Notifications deleted: {deleted_count}")
        print(f"  • Alerts deleted: {alert_deleted}")
        print(f"  • Total removed: {deleted_count + alert_deleted}")
        
        print(f"\n✅ Cleanup completed successfully!")
        print("="*80 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_unknown_person_notifications()
