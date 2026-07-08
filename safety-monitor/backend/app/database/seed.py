import datetime
from sqlalchemy.orm import Session
from app.database.models import User, Camera, Scheme, Training, Quiz, PenaltyRule, Site, Violation, Fine, NotificationHistory, Worker, WorkerScheme
from app.auth.security import get_password_hash


def seed_database(db: Session):
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@safety.com",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role="admin",
            is_active=True,
            is_superuser=True,
        )
        db.add(admin)
        db.flush()

    supervisor = db.query(User).filter(User.username == "supervisor").first()
    if not supervisor:
        supervisor = User(
            username="supervisor",
            email="supervisor@safety.com",
            hashed_password=get_password_hash("super123"),
            full_name="Site Supervisor",
            role="supervisor",
            is_active=True,
        )
        db.add(supervisor)
        db.flush()

    worker_user = db.query(User).filter(User.username == "worker").first()
    if not worker_user:
        worker_user = User(
            username="worker",
            email="worker@safety.com",
            hashed_password=get_password_hash("worker123"),
            full_name="Construction Worker",
            role="worker",
            is_active=True,
        )
        db.add(worker_user)
        db.flush()

    # Seed Safety Officer user
    safety_officer = db.query(User).filter(User.username == "safety_officer").first()
    if not safety_officer:
        safety_officer = User(
            username="safety_officer",
            email="officer@safety.com",
            hashed_password=get_password_hash("officer123"),
            full_name="Safety Officer",
            role="safety_officer",
            is_active=True,
        )
        db.add(safety_officer)
        db.flush()

    # Seed default sites
    default_sites = [
        {"name": "Main Construction Site", "location": "Sector 12, Zone A", "is_active": True},
        {"name": "Secondary Work Zone", "location": "Sector 15, Zone B", "is_active": True},
    ]
    for site_data in default_sites:
        existing = db.query(Site).filter(Site.name == site_data["name"]).first()
        if not existing:
            site = Site(**site_data)
            db.add(site)

    # Seed default penalty rules
    penalty_rules = [
        {"violation_type": "no_hardhat", "base_amount": 500, "escalation_enabled": True, "escalation_multiplier": 1.5, "max_amount": 5000},
        {"violation_type": "no_safety_vest", "base_amount": 300, "escalation_enabled": True, "escalation_multiplier": 1.5, "max_amount": 3000},
        {"violation_type": "no_mask", "base_amount": 200, "escalation_enabled": True, "escalation_multiplier": 1.5, "max_amount": 2000},
        {"violation_type": "ppe_violation", "base_amount": 500, "escalation_enabled": True, "escalation_multiplier": 1.5, "max_amount": 5000},
        {"violation_type": "smoking", "base_amount": 1000, "escalation_enabled": True, "escalation_multiplier": 2.0, "max_amount": 10000},
        {"violation_type": "fire", "base_amount": 2000, "escalation_enabled": True, "escalation_multiplier": 2.0, "max_amount": 20000},
    ]
    for rule_data in penalty_rules:
        existing = db.query(PenaltyRule).filter(PenaltyRule.violation_type == rule_data["violation_type"]).first()
        if not existing:
            rule = PenaltyRule(**rule_data)
            db.add(rule)

    cameras = [
        {"name": "Camera 1", "location": "Site Entry", "is_active": True},
        {"name": "Camera 2", "location": "Work Zone A", "is_active": True},
        {"name": "Camera 3", "location": "Work Zone B", "is_active": True},
        {"name": "Camera 4", "location": "Material Area", "is_active": True},
    ]

    for cam_data in cameras:
        existing = db.query(Camera).filter(Camera.name == cam_data["name"]).first()
        if not existing:
            cam = Camera(**cam_data)
            db.add(cam)

    schemes = [
        {
            "name": "Building and Other Construction Workers (BOCW) Welfare Scheme",
            "description": (
                "Central Government welfare scheme under the BOCW Act, 1996. "
                "Provides financial assistance, healthcare, education support, and pension "
                "benefits to registered construction workers through state Welfare Boards."
            ),
            "benefits": (
                "• Accident insurance cover up to ₹2,00,000\n"
                "• Children's education scholarship (Class 1–12)\n"
                "• Maternity benefit of ₹6,000\n"
                "• Pension up to ₹3,000/month after age 60\n"
                "• Medical assistance up to ₹50,000"
            ),
            "eligibility": (
                "• Age: 18–60 years\n"
                "• Minimum 90 days of construction work in the last 12 months\n"
                "• Registered with State BOCW Welfare Board"
            ),
            "department": "Ministry of Labour & Employment",
        },
        {
            "name": "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)",
            "description": (
                "Government-backed life insurance scheme providing affordable life coverage "
                "to workers in the unorganised sector, including construction labourers."
            ),
            "benefits": (
                "• Life insurance cover of ₹2,00,000\n"
                "• Annual premium: only ₹436\n"
                "• Covers death due to any cause\n"
                "• Nominee receives full amount on policyholder's death"
            ),
            "eligibility": (
                "• Age: 18–50 years\n"
                "• Must have a bank or post office account\n"
                "• Auto-debit of premium required"
            ),
            "department": "Ministry of Finance",
        },
        {
            "name": "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
            "description": (
                "Government accident insurance scheme providing financial protection "
                "to workers against accidental death and disability."
            ),
            "benefits": (
                "• ₹2,00,000 on accidental death\n"
                "• ₹2,00,000 on total disability\n"
                "• ₹1,00,000 on partial disability\n"
                "• Annual premium: only ₹20"
            ),
            "eligibility": (
                "• Age: 18–70 years\n"
                "• Must have a bank account\n"
                "• Auto-debit facility required"
            ),
            "department": "Ministry of Finance",
        },
        {
            "name": "Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
            "description": (
                "World's largest government health insurance scheme providing cashless "
                "hospitalisation to economically vulnerable families, including all "
                "construction worker households listed in SECC database."
            ),
            "benefits": (
                "• Health insurance cover up to ₹5,00,000 per family per year\n"
                "• Cashless treatment at empanelled hospitals\n"
                "• Covers secondary and tertiary hospitalisation\n"
                "• No cap on family size or age"
            ),
            "eligibility": (
                "• Families listed in SECC 2011 database\n"
                "• Construction workers registered with BOCW Board\n"
                "• No income ceiling for registered workers"
            ),
            "department": "Ministry of Health & Family Welfare",
        },
        {
            "name": "Pradhan Mantri Awas Yojana – Urban (PMAY-U)",
            "description": (
                "Housing scheme providing financial assistance for construction or "
                "purchase of affordable houses to workers in urban areas, including "
                "construction site labourers."
            ),
            "benefits": (
                "• Subsidy up to ₹2,67,000 on home loan\n"
                "• Interest subsidy of 6.5% for 20 years\n"
                "• Financial aid up to ₹1,50,000 for new house construction\n"
                "• Beneficiary-led construction support"
            ),
            "eligibility": (
                "• Annual household income up to ₹18,00,000\n"
                "• Must not own a pucca house in India\n"
                "• Aadhaar linked application required"
            ),
            "department": "Ministry of Housing & Urban Affairs",
        },
        {
            "name": "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
            "description": (
                "Government pension scheme designed for unorganised sector workers "
                "including construction labourers, providing old-age income security."
            ),
            "benefits": (
                "• Monthly pension of ₹3,000 after age 60\n"
                "• 50% of pension to spouse as family pension\n"
                "• Government contributes matching share\n"
                "• Exit option with refund of contribution + interest"
            ),
            "eligibility": (
                "• Age: 18–40 years\n"
                "• Monthly income up to ₹15,000\n"
                "• Must have a savings bank account and mobile number"
            ),
            "department": "Ministry of Labour & Employment",
        },
        {
            "name": "National Child Labour Project Scheme (NCLP)",
            "description": (
                "Welfare scheme to rehabilitate children of construction workers "
                "who are engaged in child labour, providing bridge education, "
                "vocational training, and mainstream schooling support."
            ),
            "benefits": (
                "• Bridge education and vocational training\n"
                "• Monthly stipend of ₹400 per child\n"
                "• Free textbooks, uniforms, and mid-day meals\n"
                "• Mainstreaming into formal schools"
            ),
            "eligibility": (
                "• Children aged 9–14 years of construction workers\n"
                "• Children rescued from child labour\n"
                "• Below poverty line families prioritised"
            ),
            "department": "Ministry of Labour & Employment",
        },
        {
            "name": "Construction Workers' Skill Development & Certification Scheme",
            "description": (
                "Government initiative under the Skill India Mission to provide "
                "free skill training, upskilling, and nationally recognised "
                "certification to construction workers for better employment."
            ),
            "benefits": (
                "• Free skill training (masonry, carpentry, plumbing, etc.)\n"
                "• Nationally recognised certification (NSQF level)\n"
                "• Stipend during training period\n"
                "• Placement assistance and job linkage\n"
                "• Recognition of prior learning (RPL) for experienced workers"
            ),
            "eligibility": (
                "• Age: 18–45 years\n"
                "• Registered with BOCW Welfare Board\n"
                "• Construction workers willing to upgrade skills"
            ),
            "department": "Ministry of Skill Development",
        },
    ]

    for scheme_data in schemes:
        existing = db.query(Scheme).filter(Scheme.name == scheme_data["name"]).first()
        if not existing:
            scheme = Scheme(**scheme_data)
            db.add(scheme)
    db.flush()

    # Auto-enroll all active workers in all schemes
    all_schemes = db.query(Scheme).filter(Scheme.is_active == True).all()
    all_workers = db.query(Worker).filter(Worker.is_active == True).all()
    for worker in all_workers:
        for scheme in all_schemes:
            existing_enrol = db.query(WorkerScheme).filter(
                WorkerScheme.worker_id == worker.id,
                WorkerScheme.scheme_id == scheme.id,
            ).first()
            if not existing_enrol:
                db.add(WorkerScheme(worker_id=worker.id, scheme_id=scheme.id))
    db.flush()

    trainings = [
        {
            "title": "PPE Usage and Safety Guidelines",
            "description": "Learn proper usage of Personal Protective Equipment",
            "training_type": "video",
            "duration_minutes": 30,
            "is_mandatory": True,
        },
        {
            "title": "Fire Safety and Evacuation Procedures",
            "description": "Understanding fire risks and evacuation protocols",
            "training_type": "video",
            "duration_minutes": 45,
            "is_mandatory": True,
        },
        {
            "title": "Working at Height Safety",
            "description": "Safety guidelines for working at elevated positions",
            "training_type": "document",
            "duration_minutes": 20,
            "is_mandatory": True,
        },
        {
            "title": "Smoking Prohibition and Fire Prevention",
            "description": "Understanding smoking risks in construction sites",
            "training_type": "video",
            "duration_minutes": 15,
            "is_mandatory": True,
        },
        {
            "title": "Emergency Response Training",
            "description": "Basic emergency response and first aid training",
            "training_type": "video",
            "duration_minutes": 60,
            "is_mandatory": False,
        },
    ]

    for training_data in trainings:
        existing = db.query(Training).filter(Training.title == training_data["title"]).first()
        if not existing:
            training = Training(**training_data)
            db.add(training)

    quizzes = [
        {
            "title": "PPE Safety Quiz",
            "description": "Test your knowledge about Personal Protective Equipment",
            "questions": [
                {"question": "When should you wear a hardhat?", "options": ["Always on site", "Only when told", "Never", "In offices"], "correct": 0},
                {"question": "What color is a safety vest?", "options": ["Red", "Orange/High-visibility", "Blue", "Black"], "correct": 1},
                {"question": "How often should safety gear be inspected?", "options": ["Daily", "Weekly", "Monthly", "Yearly"], "correct": 0},
                {"question": "What does PPE stand for?", "options": ["Personal Protective Equipment", "Public Protection Equipment", "Personal Prevention Equipment", "None"], "correct": 0},
                {"question": "When should safety gloves be worn?", "options": ["When handling materials", "Never", "Only at night", "In break room"], "correct": 0},
            ],
            "passing_score": 70,
            "time_limit_minutes": 10,
        },
        {
            "title": "Fire Safety Quiz",
            "description": "Test your knowledge about fire safety",
            "questions": [
                {"question": "What is the first step in case of fire?", "options": ["Raise alarm", "Hide", "Run", "Ignore"], "correct": 0},
                {"question": "Which fire extinguisher for electrical fires?", "options": ["CO2", "Water", "Foam", "Sand"], "correct": 0},
                {"question": "What is the evacuation assembly point?", "options": ["Designated safe area", "Parking lot", "Anywhere", "Canteen"], "correct": 0},
                {"question": "How often should fire drills be conducted?", "options": ["Quarterly", "Yearly", "Once", "Never"], "correct": 0},
                {"question": "What does PASS stand for?", "options": ["Pull Aim Squeeze Sweep", "Push Act Squeeze Sweep", "Pull Aim Stop Sweep", "None"], "correct": 0},
            ],
            "passing_score": 70,
            "time_limit_minutes": 10,
        },
    ]

    for quiz_data in quizzes:
        existing = db.query(Quiz).filter(Quiz.title == quiz_data["title"]).first()
        if not existing:
            quiz = Quiz(**quiz_data)
            db.add(quiz)

    db.commit()


def backfill_worker_notifications(db: Session):
    """
    Backfill notifications for existing violations that don't have
    corresponding worker notifications in the notification_history table.
    Run once to populate historical notification data.
    """
    # Get all violations with a worker_id
    violations = db.query(Violation).filter(
        Violation.worker_id.isnot(None)
    ).all()

    created_count = 0

    for violation in violations:
        worker = db.query(Worker).filter(Worker.id == violation.worker_id).first()
        if not worker or not worker.user_id:
            continue

        violation_type_display = violation.violation_type.replace('_', ' ').title()

        # Check if a notification already exists for this violation
        existing_notif = db.query(NotificationHistory).filter(
            NotificationHistory.user_id == worker.user_id,
            NotificationHistory.reference_type == "violation",
            NotificationHistory.reference_id == violation.id,
        ).first()

        if existing_notif:
            continue

        # Create notification based on violation status
        if violation.status == "pending":
            title = f"New Violation: {violation_type_display}"
            message = (
                f"A {violation_type_display} violation has been recorded for you. "
                f"It is pending review."
            )
            notif_type = "violation"

        elif violation.status == "approved":
            fine = db.query(Fine).filter(Fine.violation_id == violation.id).first()
            fine_amount = fine.amount if fine else 0
            title = f"Violation Approved: {violation_type_display}"
            message = (
                f"Your {violation_type_display} violation has been reviewed and approved.\n"
                f"Fine Amount: ₹{fine_amount}\n"
                f"Please pay the fine to clear this record."
            )
            notif_type = "violation_approved"

        elif violation.status == "rejected":
            title = f"Violation Dismissed: {violation_type_display}"
            message = (
                f"Your {violation_type_display} violation has been reviewed and dismissed.\n"
                f"Reason: {violation.rejection_reason or 'Not specified'}\n"
                f"No fine will be applied for this incident."
            )
            notif_type = "violation_rejected"
        else:
            continue

        notif = NotificationHistory(
            user_id=worker.user_id,
            title=title,
            message=message,
            notification_type=notif_type,
            is_read=True,  # Mark backfilled as read
            reference_type="violation",
            reference_id=violation.id,
            created_at=violation.detected_at or datetime.datetime.utcnow(),
        )
        db.add(notif)
        created_count += 1

    db.commit()
    print(f"Backfilled {created_count} worker notifications for existing violations.")
    return created_count
