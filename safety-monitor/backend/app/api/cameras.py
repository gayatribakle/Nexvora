from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.database.models import Camera, User
from app.auth.dependencies import get_current_user, require_admin
from app.config.settings import settings

router = APIRouter(prefix="/cameras", tags=["Cameras"])


@router.get("")
def list_cameras(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cameras = db.query(Camera).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "location": c.location,
            "is_active": c.is_active,
        }
        for c in cameras
    ]


@router.get("/{camera_id}")
def get_camera(camera_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {
        "id": camera.id,
        "name": camera.name,
        "location": camera.location,
        "is_active": camera.is_active,
        "video_path": camera.video_path,
    }


@router.put("/{camera_id}")
def update_camera(
    camera_id: int,
    name: Optional[str] = None,
    location: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    if name:
        camera.name = name
    if location is not None:
        camera.location = location
    if is_active is not None:
        camera.is_active = is_active

    db.commit()
    return {"message": "Camera updated"}
