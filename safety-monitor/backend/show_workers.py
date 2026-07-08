"""
Show worker login credentials
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

# Reset and show credentials
for worker in workers:
    worker_profile = db.query(Worker).filter(Worker.user_id == worker.id).first()
    
    # Set simple password
    if worker_profile and worker_profile.employee_id:
        new_password = f"worker_{worker_profile.employee_id.lower()}"
    else:
        new_password = f"worker_{worker.username}"
    
    worker.hashed_password = get_password_hash(new_password)
    db.commit()
    
    print(f"Name: {worker.full_name}")
    print(f"Username: {worker.username}")
    print(f"Password: {new_password}")
    if worker_profile:
        print(f"Department: {worker_profile.department}")
        print(f"Violations: {worker_profile.total_violations}")
        print(f"Fines: Rs. {worker_profile.total_fine_amount}")
    print("-" * 80)

db.close()
print("\nAll passwords reset successfully!")
