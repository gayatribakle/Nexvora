"""
Reset all worker passwords to a simple, known password
"""
from app.database.session import SessionLocal
from app.database.models import User, Worker
from app.auth.security import get_password_hash

db = SessionLocal()

# Get all worker users
workers = db.query(User).filter(User.role == 'worker').all()

print("\n" + "="*80)
print("WORKER ACCOUNTS - LOGIN CREDENTIALS")
print("="*80 + "\n")

# Reset password for each worker
for worker in workers:
    # Find their worker profile
    worker_profile = db.query(Worker).filter(Worker.user_id == worker.id).first()
    
    # Reset password to simple format: worker_<employee_id>
    # If no employee_id, use: worker_<username>
    if worker_profile and worker_profile.employee_id:
        new_password = f"worker_{worker_profile.employee_id.lower()}"
    else:
        new_password = f"worker_{worker.username}"
    
    # Update password
    worker.hashed_password = get_password_hash(new_password)
    db.commit()
    
    print(f"👤 Name: {worker.full_name}")
    print(f"   Username: {worker.username}")
    print(f"   Email: {worker.email}")
    print(f"   Password: {new_password}")
    if worker_profile:
        print(f"   Worker ID: {worker_profile.id}")
        print(f"   Employee ID: {worker_profile.employee_id}")
        print(f"   Department: {worker_profile.department}")
        print(f"   Safety Score: {worker_profile.safety_score}")
        print(f"   Violations: {worker_profile.total_violations}")
        print(f"   Fines: Rs. {worker_profile.total_fine_amount}")
    print("-" * 80)

db.close()

print("\n✅ All worker passwords have been reset!")
print("\n📝 LOGIN FORMAT:")
print("   Username: worker_<employee_id or name>")
print("   Password: worker_<employee_id or name>")
print("\n   Example:")
print("   Username: worker_wrk001")
print("   Password: worker_wrk001")
print("="*80 + "\n")
