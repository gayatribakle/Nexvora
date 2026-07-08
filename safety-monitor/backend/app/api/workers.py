import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.database.models import User, Worker, WorkerImage
from app.auth.dependencies import get_current_user, require_admin
from app.auth.schemas import WorkerCreate, WorkerResponse, WorkerDetailResponse
from app.services.worker_service import WorkerService
from app.detection.face.face_service import FaceService
from app.detection.face.face_adapter import FaceAdapter
from app.config.settings import settings

router = APIRouter(prefix="/workers", tags=["Workers"])


@router.get("")
def list_workers(
    department: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Worker).join(User).filter(User.is_active == True)
    if department:
        query = query.filter(Worker.department == department)

    total = query.count()
    workers = query.offset((page - 1) * limit).limit(limit).all()

    result = []
    for w in workers:
        result.append({
            "id": w.id,
            "user_id": w.user_id,
            "employee_id": w.employee_id,
            "full_name": w.user.full_name if w.user else "",
            "email": w.user.email if w.user else "",
            "phone": w.phone,
            "department": w.department,
            "designation": w.designation,
            "safety_score": w.safety_score,
            "total_violations": w.total_violations,
            "total_fines": w.total_fines,
            "total_fine_amount": w.total_fine_amount,
            "trainings_completed": w.trainings_completed,
            "quizzes_passed": w.quizzes_passed,
            "is_active": w.is_active,
            "created_at": str(w.created_at) if w.created_at else None,
            "user": {
                "id": w.user.id,
                "username": w.user.username,
                "email": w.user.email,
                "full_name": w.user.full_name,
                "role": w.user.role,
                "is_active": w.user.is_active,
            } if w.user else None,
            "images": [{
                "id": img.id,
                "filename": img.filename,
                "filepath": img.filepath,
                "is_primary": img.is_primary,
            } for img in (w.images or [])],
        })
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "workers": result,
    }


@router.get("/{worker_id}", response_model=WorkerDetailResponse)
def get_worker(worker_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    return WorkerDetailResponse(
        id=worker.id,
        user_id=worker.user_id,
        employee_id=worker.employee_id,
        full_name=worker.user.full_name if worker.user else "",
        email=worker.user.email if worker.user else "",
        phone=worker.phone,
        department=worker.department,
        designation=worker.designation,
        safety_score=worker.safety_score,
        total_violations=worker.total_violations,
        total_fines=worker.total_fines,
        total_fine_amount=worker.total_fine_amount,
        trainings_completed=worker.trainings_completed,
        quizzes_passed=worker.quizzes_passed,
        is_active=worker.is_active,
        created_at=worker.created_at,
        user=worker.user,
        images=worker.images,
    )


@router.post("", response_model=WorkerResponse)
def create_worker(data: WorkerCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    svc = WorkerService(db)
    existing = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    existing_worker = db.query(Worker).filter(Worker.employee_id == data.employee_id).first()
    if existing_worker:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    worker = svc.create_worker(data.model_dump())
    return WorkerResponse(
        id=worker.id,
        user_id=worker.user_id,
        employee_id=worker.employee_id,
        full_name=worker.user.full_name if worker.user else data.full_name,
        email=worker.user.email if worker.user else data.email,
        phone=worker.phone,
        department=worker.department,
        designation=worker.designation,
        safety_score=worker.safety_score,
        total_violations=worker.total_violations,
        total_fines=worker.total_fines,
        total_fine_amount=worker.total_fine_amount,
        trainings_completed=worker.trainings_completed,
        quizzes_passed=worker.quizzes_passed,
        is_active=worker.is_active,
        created_at=worker.created_at,
    )


import cv2

def _resize_image_if_large(filepath: str, max_dim: int = 1024):
    try:
        img = cv2.imread(filepath)
        if img is None:
            return
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            img_resized = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            cv2.imwrite(filepath, img_resized)
            print(f"[Workers API] Resized uploaded image {filepath} from {w}x{h} to {img_resized.shape[1]}x{img_resized.shape[0]}")
    except Exception as e:
        print(f"[Workers API] Error resizing image: {e}")


@router.post("/with-photo", response_model=WorkerResponse)
def create_worker_with_photo(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    employee_id: str = Form(...),
    phone: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    designation: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    svc = WorkerService(db)
    existing = db.query(User).filter(
        (User.username == username) | (User.email == email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    existing_worker = db.query(Worker).filter(Worker.employee_id == employee_id).first()
    if existing_worker:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    worker_data = {
        "username": username, "email": email, "password": password,
        "full_name": full_name, "employee_id": employee_id,
        "phone": phone, "department": department, "designation": designation,
    }
    worker = svc.create_worker(worker_data)

    os.makedirs(settings.WORKER_IMAGES_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"worker_{worker.id}_{full_name.replace(' ', '_')}{ext}"
    filepath = os.path.join(settings.WORKER_IMAGES_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    _resize_image_if_large(filepath)

    svc.upload_worker_image(worker.id, filename, filepath)

    try:
        face_svc = FaceService(FaceAdapter())
        face_svc.register_worker_face(worker.id, filepath, db)
        from app.api.monitoring import reload_face_embeddings
        reload_face_embeddings()
    except Exception as e:
        print(f"Face registration note: {e}")

    db.refresh(worker)
    return WorkerResponse(
        id=worker.id,
        user_id=worker.user_id,
        employee_id=worker.employee_id,
        full_name=full_name,
        email=email,
        phone=worker.phone,
        department=worker.department,
        designation=worker.designation,
        safety_score=worker.safety_score,
        total_violations=worker.total_violations,
        total_fines=worker.total_fines,
        total_fine_amount=worker.total_fine_amount,
        trainings_completed=worker.trainings_completed,
        quizzes_passed=worker.quizzes_passed,
        is_active=worker.is_active,
        created_at=worker.created_at,
    )


@router.post("/{worker_id}/image")
def upload_worker_image(
    worker_id: int,
    file: UploadFile = File(...),
    photo_type: str = Form("front_face"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    valid_photo_types = ["front_face", "left_profile", "right_profile", "helmet_on", "helmet_off"]
    if photo_type not in valid_photo_types:
        raise HTTPException(status_code=400, detail=f"Invalid photo_type. Must be one of: {valid_photo_types}")

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    os.makedirs(settings.WORKER_IMAGES_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"worker_{worker_id}_{photo_type}_{worker.user.full_name.replace(' ', '_')}{ext}"
    filepath = os.path.join(settings.WORKER_IMAGES_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    _resize_image_if_large(filepath)

    svc = WorkerService(db)
    svc.upload_worker_image(worker_id, filename, filepath, photo_type=photo_type)

    face_svc = FaceService(FaceAdapter())
    face_svc.register_worker_face(worker_id, filepath, db, photo_type=photo_type)
    from app.api.monitoring import reload_face_embeddings
    reload_face_embeddings()

    return {"message": "Image uploaded successfully", "filepath": filepath, "photo_type": photo_type}



@router.get("/{worker_id}/violations")
def get_worker_violations(
    worker_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    query = db.query(Worker).join(Worker.violations)
    if status:
        query = query.filter(Worker.violations.any(status=status))

    violations = worker.violations
    if status:
        violations = [v for v in violations if v.status == status]

    return [
        {
            "id": v.id,
            "violation_type": v.violation_type,
            "status": v.status,
            "confidence": v.confidence,
            "evidence_path": v.evidence_path,
            "detected_at": str(v.detected_at),
            "camera_id": v.camera_id,
        }
        for v in violations
    ]


@router.get("/{worker_id}/fines")
def get_worker_fines(worker_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    return [
        {
            "id": f.id,
            "amount": f.amount,
            "description": f.description,
            "is_paid": f.is_paid,
            "violation_type": f.violation.violation_type if f.violation else None,
            "created_at": str(f.created_at),
        }
        for f in worker.fines
    ]


@router.delete("/{worker_id}")
def delete_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    db.query(WorkerImage).filter(WorkerImage.worker_id == worker_id).delete()
    user = worker.user
    db.delete(worker)
    if user:
        db.delete(user)
    db.commit()
    return {"message": "Worker deleted"}


@router.get("/me/profile")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Only workers can access this")
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    return {
        "id": worker.id,
        "employee_id": worker.employee_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": worker.phone,
        "department": worker.department,
        "designation": worker.designation,
        "safety_score": worker.safety_score,
        "total_violations": worker.total_violations,
        "total_fines": worker.total_fines,
        "total_fine_amount": worker.total_fine_amount,
        "trainings_completed": worker.trainings_completed,
        "quizzes_passed": worker.quizzes_passed,
        "images": [{
            "id": img.id,
            "filename": img.filename,
            "filepath": img.filepath,
            "is_primary": img.is_primary,
        } for img in (worker.images or [])],
    }


@router.put("/me/profile")
def update_my_profile(
    phone: str = None,
    designation: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current worker's profile (phone and designation only)"""
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Only workers can update their profile")
    
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    
    # Update allowed fields
    if phone is not None:
        worker.phone = phone
    if designation is not None:
        worker.designation = designation
    
    db.commit()
    db.refresh(worker)
    
    return {
        "message": "Profile updated successfully",
        "phone": worker.phone,
        "designation": worker.designation,
    }
