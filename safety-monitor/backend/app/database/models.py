import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum, JSON, LargeBinary
from sqlalchemy.orm import relationship, declarative_base
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SAFETY_OFFICER = "safety_officer"
    SUPERVISOR = "supervisor"
    WORKER = "worker"


class ViolationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ViolationType(str, enum.Enum):
    NO_HARDHAT = "no_hardhat"
    NO_SAFETY_VEST = "no_safety_vest"
    NO_MASK = "no_mask"
    SMOKING = "smoking"
    FIRE = "fire"
    PPE_VIOLATION = "ppe_violation"


class AlertSeverity(str, enum.Enum):
    GREEN = "green"
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"


class EmergencyLevel(str, enum.Enum):
    GREEN = "green"
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"


class TrainingType(str, enum.Enum):
    VIDEO = "video"
    DOCUMENT = "document"
    QUIZ = "quiz"
    MANUAL = "manual"


class QuizStatus(str, enum.Enum):
    PASSED = "passed"
    FAILED = "failed"
    PENDING = "pending"


class PhotoType(str, enum.Enum):
    FRONT_FACE = "front_face"
    LEFT_PROFILE = "left_profile"
    RIGHT_PROFILE = "right_profile"
    HELMET_ON = "helmet_on"
    HELMET_OFF = "helmet_off"


class EvidenceType(str, enum.Enum):
    SCREENSHOT = "screenshot"
    PERSON_CROP = "person_crop"
    FACE_CROP = "face_crop"
    VIDEO_CLIP = "video_clip"


class VideoStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    location = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    workers = relationship("Worker", back_populates="site")
    violations = relationship("Violation", back_populates="site")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(String(20), default=UserRole.WORKER.value, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    worker = relationship("Worker", back_populates="user", uselist=False)
    notifications = relationship("NotificationHistory", back_populates="user")


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    contractor = Column(String(200), nullable=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    site_assignment = Column(String(200), nullable=True)
    safety_score = Column(Integer, default=100)
    total_violations = Column(Integer, default=0)
    total_fines = Column(Integer, default=0)
    total_fine_amount = Column(Float, default=0.0)
    trainings_completed = Column(Integer, default=0)
    quizzes_passed = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="worker")
    site = relationship("Site", back_populates="workers")
    images = relationship("WorkerImage", back_populates="worker", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="worker")
    fines = relationship("Fine", back_populates="worker")
    schemes = relationship("WorkerScheme", back_populates="worker", cascade="all, delete-orphan")
    trainings = relationship("WorkerTraining", back_populates="worker", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="worker", cascade="all, delete-orphan")
    safety_history = relationship("SafetyHistory", back_populates="worker", cascade="all, delete-orphan")
    embeddings = relationship("EmployeeEmbedding", back_populates="worker", cascade="all, delete-orphan")


class WorkerImage(Base):
    __tablename__ = "worker_images"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    embedding = Column(Text, nullable=True)
    photo_type = Column(String(30), default=PhotoType.FRONT_FACE.value, nullable=True)
    is_primary = Column(Boolean, default=False)
    minio_key = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    worker = relationship("Worker", back_populates="images")


class EmployeeEmbedding(Base):
    __tablename__ = "employee_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False, index=True)
    embedding = Column(Text, nullable=False)
    embedding_dim = Column(Integer, default=512)
    photo_type = Column(String(30), default=PhotoType.FRONT_FACE.value, nullable=True)
    source_image_id = Column(Integer, ForeignKey("worker_images.id"), nullable=True)
    model_name = Column(String(100), default="Facenet512")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    worker = relationship("Worker", back_populates="embeddings")
    source_image = relationship("WorkerImage")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rtsp_url = Column(String(500), nullable=True)
    video_path = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    location = Column(String(200), nullable=True)
    stream_port = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    violations = relationship("Violation", back_populates="camera")
    alerts = relationship("Alert", back_populates="camera")


class UploadedVideo(Base):
    __tablename__ = "uploaded_videos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    minio_key = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    video_format = Column(String(20), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    status = Column(String(20), default=VideoStatus.UPLOADED.value, nullable=False, index=True)
    processing_progress = Column(Float, default=0.0)
    processing_error = Column(Text, nullable=True)
    processing_started_at = Column(DateTime, nullable=True)
    total_frames = Column(Integer, nullable=True)
    frames_processed = Column(Integer, default=0)
    violations_found = Column(Integer, default=0)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    camera = relationship("Camera")
    uploader = relationship("User", foreign_keys=[uploaded_by])


class PenaltyRule(Base):
    __tablename__ = "penalty_rules"

    id = Column(Integer, primary_key=True, index=True)
    violation_type = Column(String(50), unique=True, nullable=False, index=True)
    base_amount = Column(Float, nullable=False)
    escalation_enabled = Column(Boolean, default=False)
    escalation_multiplier = Column(Float, default=1.5)
    max_amount = Column(Float, default=10000.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    violation_type = Column(String(50), nullable=False, index=True)
    status = Column(String(20), default=ViolationStatus.PENDING.value, nullable=False, index=True)
    confidence = Column(Float, nullable=True)
    evidence_path = Column(String(500), nullable=True)
    screenshot_path = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    fingerprint = Column(String(255), nullable=True, index=True)
    needs_review = Column(Boolean, default=False, nullable=False)
    face_confidence = Column(Float, nullable=True)
    face_gap = Column(Float, nullable=True)
    confidence_level = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    worker = relationship("Worker", back_populates="violations")
    camera = relationship("Camera", back_populates="violations")
    site = relationship("Site", back_populates="violations")
    fine = relationship("Fine", back_populates="violation", uselist=False)
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    evidence_files = relationship("Evidence", back_populates="violation", cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False, index=True)
    evidence_type = Column(String(30), default=EvidenceType.SCREENSHOT.value, nullable=False)
    file_path = Column(String(500), nullable=True)
    minio_key = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    violation = relationship("Violation", back_populates="evidence_files")


class ViolationReviewQueue(Base):
    __tablename__ = "violation_review_queue"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default=ViolationStatus.PENDING.value)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    violation = relationship("Violation")
    assignee = relationship("User", foreign_keys=[assigned_to])
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class Fine(Base):
    __tablename__ = "fines"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    amount = Column(Float, nullable=False)
    adjusted_amount = Column(Float, nullable=True)
    adjustment_reason = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    is_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    worker = relationship("Worker", back_populates="fines")
    violation = relationship("Violation", back_populates="fine")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    violation_type = Column(String(50), nullable=False)
    severity = Column(String(20), default=AlertSeverity.YELLOW.value)
    message = Column(Text, nullable=False)
    worker_name = Column(String(200), nullable=True)
    is_read = Column(Boolean, default=False)
    is_emergency = Column(Boolean, default=False)
    fingerprint = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    camera = relationship("Camera", back_populates="alerts")


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    eligibility = Column(Text, nullable=True)
    document_required = Column(Text, nullable=True)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    worker_assignments = relationship("WorkerScheme", back_populates="scheme", cascade="all, delete-orphan")


class WorkerScheme(Base):
    __tablename__ = "worker_schemes"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    is_enrolled = Column(Boolean, default=True)
    enrolled_at = Column(DateTime, default=datetime.datetime.utcnow)

    worker = relationship("Worker", back_populates="schemes")
    scheme = relationship("Scheme", back_populates="worker_assignments")


class Training(Base):
    __tablename__ = "trainings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    training_type = Column(String(50), default=TrainingType.VIDEO.value)
    content_url = Column(String(500), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    is_mandatory = Column(Boolean, default=False)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    worker_assignments = relationship("WorkerTraining", back_populates="training", cascade="all, delete-orphan")


class WorkerTraining(Base):
    __tablename__ = "worker_trainings"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    training_id = Column(Integer, ForeignKey("trainings.id"), nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    score = Column(Integer, nullable=True)

    worker = relationship("Worker", back_populates="trainings")
    training = relationship("Training", back_populates="worker_assignments")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    questions = Column(JSON, nullable=False)
    passing_score = Column(Integer, default=70)
    time_limit_minutes = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    status = Column(String(20), default=QuizStatus.PENDING.value)
    answers = Column(JSON, nullable=True)
    attempted_at = Column(DateTime, default=datetime.datetime.utcnow)

    worker = relationship("Worker", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="attempts")


class SafetyHistory(Base):
    __tablename__ = "safety_history"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    score_before = Column(Integer, nullable=False)
    score_after = Column(Integer, nullable=False)
    change_reason = Column(String(200), nullable=False)
    change_amount = Column(Integer, nullable=False)

    worker = relationship("Worker", back_populates="safety_history")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    file_path = Column(String(500), nullable=True)
    minio_key = Column(String(500), nullable=True)
    format = Column(String(10), default="pdf")
    parameters = Column(JSON, nullable=True)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default=EmergencyLevel.ORANGE.value)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class NotificationHistory(Base):
    __tablename__ = "notification_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="in_app")
    is_read = Column(Boolean, default=False)
    reference_type = Column(String(50), nullable=True)
    reference_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
