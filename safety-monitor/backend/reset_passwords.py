"""Script to reset admin password to admin123"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database.session import SessionLocal
from app.database.models import User
from app.auth.security import get_password_hash

def reset_password():
    db = SessionLocal()
    try:
        # Update admin password
        admin = db.query(User).filter(User.username == 'admin').first()
        if admin:
            admin.hashed_password = get_password_hash("admin123")
            db.commit()
            print("✓ Admin password reset to: admin123")
        else:
            print("✗ Admin user not found")
            
        # Update safety_officer password
        officer = db.query(User).filter(User.username == 'safety_officer').first()
        if officer:
            officer.hashed_password = get_password_hash("officer123")
            db.commit()
            print("✓ Safety Officer password reset to: officer123")
            
        # Update supervisor password
        supervisor = db.query(User).filter(User.username == 'supervisor').first()
        if supervisor:
            supervisor.hashed_password = get_password_hash("supervisor123")
            db.commit()
            print("✓ Supervisor password reset to: supervisor123")
            
        # Update worker password
        worker = db.query(User).filter(User.username == 'worker').first()
        if worker:
            worker.hashed_password = get_password_hash("worker123")
            db.commit()
            print("✓ Worker password reset to: worker123")
            
        print("\n📋 Login Credentials:")
        print("=" * 50)
        print("Admin:")
        print("  Username: admin")
        print("  Password: admin123")
        print("\nSafety Officer:")
        print("  Username: safety_officer")
        print("  Password: officer123")
        print("\nSupervisor:")
        print("  Username: supervisor")
        print("  Password: supervisor123")
        print("\nWorker:")
        print("  Username: worker")
        print("  Password: worker123")
        print("=" * 50)
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
