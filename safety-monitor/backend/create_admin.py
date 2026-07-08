"""Script to create default admin user"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database.session import SessionLocal
from app.database.models import User, UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.username == 'admin').first()
        
        if admin:
            print("✓ Admin user already exists")
            print(f"  Username: {admin.username}")
            print(f"  Email: {admin.email}")
            print(f"  Role: {admin.role}")
        else:
            # Create admin user
            hashed_password = pwd_context.hash("admin123")
            admin = User(
                username="admin",
                email="admin@company.com",
                hashed_password=hashed_password,
                full_name="System Administrator",
                role=UserRole.ADMIN.value,
                is_active=True,
                is_superuser=True
            )
            db.add(admin)
            db.commit()
            print("✓ Admin user created successfully!")
            print("  Username: admin")
            print("  Password: admin123")
            print("  Email: admin@company.com")
            print("  Role: admin")
            
        # Check if safety_officer exists
        officer = db.query(User).filter(User.username == 'safety_officer').first()
        if not officer:
            hashed_password = pwd_context.hash("officer123")
            officer = User(
                username="safety_officer",
                email="officer@company.com",
                hashed_password=hashed_password,
                full_name="Safety Officer",
                role=UserRole.SAFETY_OFFICER.value,
                is_active=True,
                is_superuser=False
            )
            db.add(officer)
            db.commit()
            print("\n✓ Safety Officer user created successfully!")
            print("  Username: safety_officer")
            print("  Password: officer123")
            print("  Email: officer@company.com")
            print("  Role: safety_officer")
        else:
            print(f"\n✓ Safety Officer already exists")
            
        # List all users
        print("\n📋 All users in database:")
        users = db.query(User).all()
        for user in users:
            print(f"  - {user.username} ({user.email}) - Role: {user.role}")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
