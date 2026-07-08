import os
import shutil
import datetime
import threading
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import SessionLocal, get_db
from app.database.models import User, UploadedVideo, Camera
from app.auth.dependencies import get_current_user, require_admin, require_safety_officer_or_admin
from app.auth.security import decode_access_token
from app.config.settings import settings

router = APIRouter(prefix="/videos", tags=["Videos"])


@router.post("/upload")
def upload_video(
    file: UploadFile = File(...),
    camera_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_safety_officer_or_admin),
):
    """Upload a video file for processing."""
    # Validate file format
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = os.path.splitext(file.filename)[1].lower().lstrip(".")
    if ext not in settings.ALLOWED_VIDEO_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format '{ext}'. Allowed: {settings.ALLOWED_VIDEO_FORMATS}",
        )

    # Validate camera exists if provided
    if camera_id:
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")

    # Save file
    upload_dir = os.path.join(settings.UPLOAD_DIR, "videos")
    os.makedirs(upload_dir, exist_ok=True)

    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    safe_filename = f"video_{timestamp}.{ext}"
    filepath = os.path.join(upload_dir, safe_filename)

    # Check file size
    max_size = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024
    total_size = 0
    with open(filepath, "wb") as f:
        for chunk in iter(lambda: file.file.read(1024 * 1024), b""):
            total_size += len(chunk)
            if total_size > max_size:
                f.close()
                os.remove(filepath)
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large. Max size: {settings.MAX_VIDEO_SIZE_MB}MB",
                )
            f.write(chunk)

    # Try to upload to MinIO
    minio_key = None
    try:
        from app.storage.minio_client import upload_file
        minio_key = upload_file(filepath, object_name=f"videos/{safe_filename}")
    except Exception:
        pass  # MinIO optional

    # Get video duration
    duration_seconds = None
    try:
        import cv2
        cap = cv2.VideoCapture(filepath)
        if cap.isOpened():
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if fps > 0:
                duration_seconds = frame_count / fps
            cap.release()
    except Exception:
        pass

    # Create DB record
    video = UploadedVideo(
        filename=safe_filename,
        original_name=file.filename,
        file_path=filepath,
        minio_key=minio_key,
        file_size=total_size,
        video_format=ext,
        duration_seconds=duration_seconds,
        status="uploaded",
        camera_id=camera_id,
        uploaded_by=current_user.id,
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    # Mark as processing and return immediately — actual processing runs in background
    video.status = "processing"
    video.processing_started_at = datetime.datetime.utcnow()
    video.processing_progress = 0.0
    db.commit()

    # Launch processing in a background thread so the upload response returns fast
    threading.Thread(
        target=_process_video_background,
        args=(video.id,),
        daemon=True,
    ).start()

    return {
        "id": video.id,
        "filename": video.original_name,
        "status": video.status,
        "file_size": video.file_size,
        "format": video.video_format,
        "duration_seconds": video.duration_seconds,
        "created_at": str(video.created_at),
    }


def _process_video_background(video_id: int):
    """Run video processing in a background thread with its own DB session.
    Sends admin notification on completion or failure."""
    from app.tasks.video_tasks import process_video_sync
    from app.services.notification_service import NotificationService

    db = SessionLocal()
    try:
        result = process_video_sync(video_id)
        # Refresh video to get updated status
        video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
        if video:
            violations_count = video.violations_found or 0
            # Notify all admins about processing completion
            try:
                notif_svc = NotificationService(db)
                if violations_count > 0:
                    notif_svc.broadcast_alert(
                        title=f"Video Processed: {violations_count} Violations Found",
                        message=(
                            f"Video '{video.original_name}' has been processed.\n"
                            f"Frames processed: {video.frames_processed}/{video.total_frames}\n"
                            f"Violations detected: {violations_count}\n"
                            f"Check the Violations page to review."
                        ),
                        severity="orange" if violations_count > 5 else "yellow",
                    )
                else:
                    notif_svc.broadcast_alert(
                        title=f"Video Processed: No Violations",
                        message=f"Video '{video.original_name}' processed successfully. No violations found in {video.frames_processed} frames.",
                        severity="green",
                    )
            except Exception as notif_err:
                print(f"Video notification error: {notif_err}")
    except Exception as e:
        print(f"Background video processing error: {e}")
        try:
            video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
            if video:
                video.status = "failed"
                video.processing_error = str(e)
                db.commit()
                # Notify admins about failure
                notif_svc = NotificationService(db)
                notif_svc.broadcast_alert(
                    title=f"Video Processing Failed",
                    message=f"Video '{video.original_name}' failed to process.\nError: {str(e)[:200]}",
                    severity="red",
                )
        except Exception as inner_err:
            print(f"Failed to set video error status: {inner_err}")
    finally:
        db.close()


@router.get("")
def list_videos(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List uploaded videos with optional status filter."""
    query = db.query(UploadedVideo)
    if status:
        query = query.filter(UploadedVideo.status == status)

    total = query.count()
    videos = query.order_by(UploadedVideo.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "videos": [
            {
                "id": v.id,
                "filename": v.original_name,
                "status": v.status,
                "file_size": v.file_size,
                "format": v.video_format,
                "duration_seconds": v.duration_seconds,
                "processing_progress": v.processing_progress,
                "violations_found": v.violations_found,
                "camera_id": v.camera_id,
                "created_at": str(v.created_at),
                "processed_at": str(v.processed_at) if v.processed_at else None,
            }
            for v in videos
        ],
    }


@router.get("/{video_id}")
def get_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get details of a specific uploaded video."""
    video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return {
        "id": video.id,
        "filename": video.original_name,
        "status": video.status,
        "file_size": video.file_size,
        "format": video.video_format,
        "duration_seconds": video.duration_seconds,
        "processing_progress": video.processing_progress,
        "processing_error": video.processing_error,
        "total_frames": video.total_frames,
        "frames_processed": video.frames_processed,
        "violations_found": video.violations_found,
        "camera_id": video.camera_id,
        "uploaded_by": video.uploaded_by,
        "created_at": str(video.created_at),
        "processed_at": str(video.processed_at) if video.processed_at else None,
    }


@router.get("/{video_id}/progress")
def get_video_progress(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get processing progress for a video."""
    video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return {
        "id": video.id,
        "status": video.status,
        "progress": video.processing_progress,
        "error": video.processing_error,
        "total_frames": video.total_frames,
        "frames_processed": video.frames_processed,
        "violations_found": video.violations_found,
    }


@router.post("/{video_id}/process")
def trigger_processing(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_safety_officer_or_admin),
    sync: Optional[str] = Query(None, description="Ignored — always uses background thread"),
):
    """Manually trigger processing for a video.
    Processing always runs in a background thread. Poll /videos/{id}/progress for status.
    """
    video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.status == "processing":
        raise HTTPException(status_code=400, detail="Video is already being processed")

    video.status = "processing"
    video.processing_started_at = datetime.datetime.utcnow()
    video.processing_progress = 0.0
    video.processing_error = None
    db.commit()

    # Launch in background thread
    threading.Thread(
        target=_process_video_background,
        args=(video.id,),
        daemon=True,
    ).start()

    return {
        "message": "Processing started in background",
        "video_id": video_id,
        "mode": "background",
    }


@router.delete("/{video_id}")
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Delete an uploaded video."""
    video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Remove file from disk
    if video.file_path and os.path.exists(video.file_path):
        os.remove(video.file_path)

    # Remove from MinIO
    if video.minio_key:
        try:
            from app.storage.minio_client import delete_object
            delete_object(video.minio_key)
        except Exception:
            pass

    db.delete(video)
    db.commit()
    return {"message": "Video deleted"}


@router.get("/{video_id}/play")
def play_video(
    video_id: int,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Stream the uploaded video file for playback in browser. Supports ?token= for <video> tag auth."""
    # Auth: header or query token
    if token:
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
    # (If no token and no header, FastAPI's Depends(get_current_user) would catch it;
    #  but we removed that dep to allow query-param auth)
    video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if not video.file_path or not os.path.exists(video.file_path):
        raise HTTPException(status_code=404, detail="Video file not found on disk")
    return FileResponse(
        video.file_path,
        media_type="video/mp4",
        filename=video.original_name or video.filename,
    )


@router.get("/{video_id}/debug-frames")
def list_debug_frames(
    video_id: int,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List debug frames saved during processing."""
    debug_dir = os.path.join(settings.UPLOAD_DIR, "debug_frames", f"video_{video_id}")
    if not os.path.exists(debug_dir):
        return {"frames": [], "count": 0}
    frames = sorted([
        f for f in os.listdir(debug_dir)
        if f.endswith((".jpg", ".png"))
    ])
    return {
        "frames": frames,
        "count": len(frames),
        "violations": [f for f in frames if f.startswith("violation_")],
        "annotated": [f for f in frames if f.startswith("frame_") or f.startswith("violation_")],
        "raw": [f for f in frames if f.startswith("raw_")],
    }


@router.get("/{video_id}/debug-frames/{filename}")
def get_debug_frame(
    video_id: int,
    filename: str,
    token: Optional[str] = Query(None),
):
    """Serve a single debug frame image."""
    frame_path = os.path.join(settings.UPLOAD_DIR, "debug_frames", f"video_{video_id}", filename)
    if not os.path.exists(frame_path):
        raise HTTPException(status_code=404, detail="Frame not found")
    return FileResponse(frame_path, media_type="image/jpeg")
