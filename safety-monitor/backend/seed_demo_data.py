"""Seed database with realistic sample data for demo"""
import sys
import os
import random
import datetime
sys.path.insert(0, os.path.dirname(__file__))

from app.database.session import SessionLocal
from app.database.models import (
    User, Worker, Camera, Violation, Evidence, 
    PenaltyRule, Fine, SystemLog, Site, Training, Quiz
)
from app.auth.security import get_password_hash

db = SessionLocal()

def seed_realistic_data():
    print("Seeding realistic demo data...\n")
    
    try:
        # 1. Create realistic workers
        print("[1/5] Creating workers...")
        workers_data = [
            {"employee_id": "WRK001", "name": "Rajesh Kumar", "phone": "+91-9876543210", "department": "Construction", "designation": "Senior Mason", "contractor": "ABC Constructions"},
            {"employee_id": "WRK002", "name": "Suresh Patel", "phone": "+91-9876543211", "department": "Electrical", "designation": "Electrician", "contractor": "PowerGrid Services"},
            {"employee_id": "WRK003", "name": "Amit Sharma", "phone": "+91-9876543212", "department": "Construction", "designation": "Helper", "contractor": "ABC Constructions"},
            {"employee_id": "WRK004", "name": "Vikram Singh", "phone": "+91-9876543213", "department": "Mechanical", "designation": "Welder", "contractor": "Metal Works Ltd"},
            {"employee_id": "WRK005", "name": "Mohan Das", "phone": "+91-9876543214", "department": "Safety", "designation": "Safety Supervisor", "contractor": "Safety First Inc"},
            {"employee_id": "WRK006", "name": "Ravi Shankar", "phone": "+91-9876543215", "department": "Construction", "designation": "Carpenter", "contractor": "Wood Craft Co"},
            {"employee_id": "WRK007", "name": "Pradeep Yadav", "phone": "+91-9876543216", "department": "Electrical", "designation": "Junior Electrician", "contractor": "PowerGrid Services"},
            {"employee_id": "WRK008", "name": "Sanjay Gupta", "phone": "+91-9876543217", "department": "Mechanical", "designation": "Machine Operator", "contractor": "Heavy Machinery Ltd"},
            {"employee_id": "WRK009", "name": "Ramesh Reddy", "phone": "+91-9876543218", "department": "Construction", "designation": "Painter", "contractor": "ABC Constructions"},
            {"employee_id": "WRK010", "name": "Kiran Rao", "phone": "+91-9876543219", "department": "Plumbing", "designation": "Plumber", "contractor": "Water Works"},
            {"employee_id": "WRK011", "name": "Deepak Verma", "phone": "+91-9876543220", "department": "Construction", "designation": "Steel Fixer", "contractor": "Steel Masters"},
            {"employee_id": "WRK012", "name": "Arjun Nair", "phone": "+91-9876543221", "department": "Electrical", "designation": "Senior Electrician", "contractor": "PowerGrid Services"},
            {"employee_id": "WRK013", "name": "Manoj Tiwari", "phone": "+91-9876543222", "department": "Construction", "designation": "Crane Operator", "contractor": "Heavy Machinery Ltd"},
            {"employee_id": "WRK014", "name": "Sachin Joshi", "phone": "+91-9876543223", "department": "Mechanical", "designation": "Fitter", "contractor": "Metal Works Ltd"},
            {"employee_id": "WRK015", "name": "Ganesh Pillai", "phone": "+91-9876543224", "department": "Construction", "designation": "Mason", "contractor": "ABC Constructions"},
        ]
        
        created_workers = []
        for w_data in workers_data:
            # Check if worker already exists
            existing = db.query(Worker).filter(Worker.employee_id == w_data["employee_id"]).first()
            if existing:
                created_workers.append(existing)
                continue
                
            # Create user account
            username = f"worker_{w_data['employee_id'].lower()}"
            user = db.query(User).filter(User.username == username).first()
            if not user:
                user = User(
                    username=username,
                    email=f"{w_data['employee_id'].lower()}@company.com",
                    hashed_password=get_password_hash("worker123"),
                    full_name=w_data["name"],
                    role="worker",
                    is_active=True
                )
                db.add(user)
                db.flush()
            
            # Create worker
            worker = Worker(
                user_id=user.id,
                employee_id=w_data["employee_id"],
                phone=w_data["phone"],
                department=w_data["department"],
                designation=w_data["designation"],
                contractor=w_data["contractor"],
                safety_score=random.randint(65, 98),
                total_violations=random.randint(0, 8),
                total_fines=random.randint(0, 5),
                total_fine_amount=0,  # Will be calculated
                trainings_completed=random.randint(2, 8),
                quizzes_passed=random.randint(1, 6),
                is_active=True
            )
            db.add(worker)
            db.flush()
            created_workers.append(worker)
            print(f"  [+] {w_data['name']} ({w_data['employee_id']})")
        
        db.commit()
        print(f"\n[OK] Created {len(created_workers)} workers\n")
        
        # 2. Create realistic violations
        print("[2/5] Creating violations...")
        violation_types = [
            ("no_hardhat", "No Hardhat", 500),
            ("no_safety_vest", "No Safety Vest", 300),
            ("smoking", "Smoking in Restricted Area", 1000),
            ("fire_hazard", "Fire Hazard", 1500),
            ("no_gloves", "No Safety Gloves", 200),
            ("no_safety_shoes", "No Safety Shoes", 400),
        ]
        
        locations = ["Building A - Floor 1", "Building A - Floor 2", "Building B - Ground", 
                     "Parking Area", "Warehouse", "Main Gate", "Workshop", "Storage Area"]
        
        # Generate violations for last 30 days
        for i in range(50):
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            detected_at = datetime.datetime.utcnow() - datetime.timedelta(days=days_ago, hours=hours_ago)
            
            violation_type, violation_name, fine_amount = random.choice(violation_types)
            worker = random.choice(created_workers)
            camera = db.query(Camera).filter(Camera.is_active == True).first()
            
            # Create violation
            violation = Violation(
                worker_id=worker.id,
                camera_id=camera.id if camera else 1,
                violation_type=violation_type,
                description=f"{violation_name} detected at {random.choice(locations)}",
                detected_at=detected_at,
                confidence=round(random.uniform(0.75, 0.99), 2),
                status=random.choice(["pending", "approved", "approved", "approved"]),  # 75% approved
                needs_review=(random.random() < 0.3)  # 30% need review
            )
            db.add(violation)
            db.flush()
            
            # Create fine if violation is approved
            if violation.status == "approved":
                fine = Fine(
                    worker_id=worker.id,
                    violation_id=violation.id,
                    amount=fine_amount,
                    description=f"Fine for {violation_name}",
                    is_paid=random.random() < 0.4,  # 40% paid
                    paid_at=datetime.datetime.utcnow() if random.random() < 0.4 else None
                )
                db.add(fine)
                
                # Update worker stats
                worker.total_violations += 1
                worker.total_fines += 1
                worker.total_fine_amount += fine_amount
                worker.safety_score = max(0, worker.safety_score - random.randint(2, 8))
            
            if i % 10 == 0:
                worker_name = db.query(User).filter(User.id == worker.user_id).first().full_name
                print(f"  [+] Violation {i+1}/50: {violation_name} - {worker_name}")
        
        db.commit()
        print(f"\n[OK] Created 50 violations\n")
        
        # 3. Create penalty rules
        print("[3/5] Creating penalty rules...")
        penalty_rules = [
            ("no_hardhat", "No Hardhat", 500, "Mandatory PPE violation"),
            ("no_safety_vest", "No Safety Vest", 300, "Mandatory PPE violation"),
            ("smoking", "Smoking in Restricted Area", 1000, "Fire hazard and health violation"),
            ("fire_hazard", "Fire Hazard", 1500, "Critical safety violation"),
            ("no_gloves", "No Safety Gloves", 200, "PPE violation for specific tasks"),
            ("no_safety_shoes", "No Safety Shoes", 400, "Mandatory PPE violation"),
        ]
        
        for rule_type, rule_name, amount, description in penalty_rules:
            existing = db.query(PenaltyRule).filter(PenaltyRule.violation_type == rule_type).first()
            if not existing:
                rule = PenaltyRule(
                    violation_type=rule_type,
                    base_amount=amount,
                    escalation_enabled=True,
                    escalation_multiplier=1.5,
                    max_amount=amount * 3,
                    is_active=True
                )
                db.add(rule)
                print(f"  [+] {rule_name}: Rs.{amount}")
        
        db.commit()
        print("\n[OK] Created penalty rules\n")
        
        # 4. Create training modules
        print("[4/5] Creating training modules...")
        trainings = [
            ("PPE Safety Fundamentals", "Learn about proper use of Personal Protective Equipment", "video", 45, True),
            ("Working at Height Safety", "Safety procedures for working at heights", "video", 60, True),
            ("Fire Prevention and Response", "How to prevent fires and respond to emergencies", "video", 40, True),
            ("Electrical Safety", "Safe practices for electrical work", "video", 50, True),
            ("First Aid Basics", "Basic first aid procedures", "video", 35, False),
            ("Machinery Operation Safety", "Safe operation of heavy machinery", "video", 55, True),
        ]
        
        for title, desc, type, duration, mandatory in trainings:
            existing = db.query(Training).filter(Training.title == title).first()
            if not existing:
                training = Training(
                    title=title,
                    description=desc,
                    training_type=type,
                    content_url=f"https://example.com/training/{title.lower().replace(' ', '-')}",
                    duration_minutes=duration,
                    is_mandatory=mandatory,
                    is_active=True
                )
                db.add(training)
                print(f"  [+] {title} ({duration} min)")
        
        db.commit()
        print("\n[OK] Created training modules\n")
        
        # 5. Create quiz modules
        print("[5/5] Creating quizzes...")
        quizzes = [
            ("PPE Safety Quiz", "Test your knowledge about PPE", 10, 80, 15),
            ("Fire Safety Quiz", "Fire safety knowledge test", 10, 75, 15),
            ("Electrical Safety Quiz", "Electrical safety assessment", 10, 80, 20),
        ]
        
        for title, desc, questions, passing_score, time_limit in quizzes:
            existing = db.query(Quiz).filter(Quiz.title == title).first()
            if not existing:
                quiz = Quiz(
                    title=title,
                    description=desc,
                    questions={"q1": {"question": "Sample question?", "options": ["A", "B", "C", "D"], "correct": "A"}},
                    passing_score=passing_score,
                    time_limit_minutes=time_limit,
                    is_active=True
                )
                db.add(quiz)
                print(f"  [+] {title}")
        
        db.commit()
        print("\n[OK] Created quizzes\n")
        
        # Summary
        print("=" * 60)
        print("SEEDING SUMMARY")
        print("=" * 60)
        print(f"[+] Workers: {len(created_workers)}")
        print(f"[+] Violations: 50")
        print(f"[+] Penalty Rules: {len(penalty_rules)}")
        print(f"[+] Training Modules: {len(trainings)}")
        print(f"[+] Quizzes: {len(quizzes)}")
        print("=" * 60)
        print("\nDatabase seeded successfully!")
        print("All worker passwords: worker123")
        print("\nLogin credentials:")
        print("  Admin: admin / admin123")
        print("  Worker: worker_WRK001 / worker123")
        
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_realistic_data()
