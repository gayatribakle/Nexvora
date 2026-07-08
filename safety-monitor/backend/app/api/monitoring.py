import cv2
import json
import os
import time
import asyncio
import datetime
import threading
import numpy as np
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict

from app.database.session import get_db, SessionLocal
from app.database.models import User, Camera, Worker
from app.auth.dependencies import get_current_user, require_admin
from app.cameras.stream_manager import StreamManager
from app.detection.detection_manager import DetectionManager
from app.detection.face.face_service import FaceService
from app.detection.face.face_adapter import FaceAdapter, get_quality_filter_stats, reset_quality_filter_stats, compute_quality_analytics_report, clear_quality_analytics, get_recognition_engine_info, is_deepface_inference_ok, get_deepface_startup_time
from app.detection.face.threshold_calibrator import compute_stats, record_match, reset_data as reset_calibration
from app.detection.face.face_adapter import _enhance_face
from app.services.violation_service import ViolationService
from app.services.fine_service import FineService
from app.services.notification_service import NotificationService
from app.services.worker_service import WorkerService
from app.websocket.ws_manager import ws_manager
from app.config.settings import settings

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])

stream_manager = StreamManager(max_cameras=settings.MAX_CAMERAS)
detection_manager = DetectionManager()
_monitoring_active = False
_active_streams = 0
_streams_lock = threading.Lock()
_alert_throttle = {}  # fingerprint -> expiry timestamp
_throttle_lock = threading.Lock()


def process_detection_result(camera_id: int, frame: np.ndarray, alerts: list, annotated_frame: np.ndarray = None):
    if not alerts:
        return

    db = SessionLocal()
    try:
        violation_svc = ViolationService(db)
        fine_svc = FineService(db)
        notif_svc = NotificationService(db)
        worker_svc = WorkerService(db)

        for alert in alerts:
            violation_type = alert.get("violation_type")
            if not violation_type:
                continue

            worker_id = alert.get("worker_id")
            worker_name = alert.get("worker_name", "Unknown")

            confidence_level = alert.get("confidence_level", "")
            needs_review = confidence_level == "PROBABLE"

            viol_data = {
                "camera_id": camera_id,
                "violation_type": violation_type,
                "confidence": alert.get("confidence", 0.0),
                "worker_id": worker_id,
                "worker_name": worker_name,
                "severity": alert.get("severity", "yellow"),
                "frame": frame,
                "annotated_frame": annotated_frame,
                "needs_review": needs_review,
                "confidence_level": confidence_level,
                "face_confidence": alert.get("face_confidence") if not needs_review else None,
                "face_gap": alert.get("face_gap"),
                "description": f"{violation_type} detected on Camera {camera_id} at {datetime.datetime.utcnow().isoformat()}",
            }

            violation = violation_svc.create_violation(viol_data)

            # Only send notifications if worker is IDENTIFIED (not unknown)
            if not worker_id:
                # Unknown person detected - log violation but don't send notifications
                print(f"[UNKNOWN] {violation_type} detected on Camera {camera_id} - No notification sent (worker not identified)")
                continue

            face_confirmed = alert.get("face_confirmed", False)
            if violation and face_confirmed:
                if confidence_level == "HIGH":
                    violation_svc.approve_violation(violation.id, None)
                    fine = fine_svc.create_fine(violation.id)
                    if fine:
                        worker_svc.update_safety_score(worker_id, -10, f"Violation: {violation_type}")

                        if violation.worker and violation.worker.user_id:
                            notif_svc.send_notification(
                                user_id=violation.worker.user_id,
                                title=f"Fine Issued: {violation_type}",
                                message=f"Fine of ₹{fine.amount} for {violation_type}. Safety score reduced by 10.",
                                reference_type="fine",
                                reference_id=fine.id,
                            )

                        # Only broadcast alert to admin if it's high severity/emergency
                        if alert.get("severity") in ("orange", "red") or violation_type == "fire":
                            notif_svc.broadcast_alert(
                                title=f"Violation: {violation_type}",
                                message=f"{worker_name} - {violation_type} on Camera {camera_id} - Fine: ₹{fine.amount}",
                                severity=alert.get("severity", "yellow"),
                            )
                else:
                    # Only broadcast alert to admin if it's high severity/emergency
                    if alert.get("severity") in ("orange", "red") or violation_type == "fire":
                        notif_svc.broadcast_alert(
                            title=f"Probable Violation: {violation_type}",
                            message=f"Probable match: {worker_name} - {violation_type} on Camera {camera_id} (Needs Review)",
                            severity=alert.get("severity", "yellow"),
                        )

    except Exception as e:
        print(f"Error processing detection result: {e}")
    finally:
        db.close()


def reload_face_embeddings():
    """Reload face embeddings from DB so newly registered workers are recognized.
    Retries up to 30s if face_adapter isn't ready yet."""
    for attempt in range(30):
        if detection_manager.face_adapter:
            break
        time.sleep(1)
    if not detection_manager.face_adapter:
        print("Face adapter not ready, skipping embedding reload")
        return
    try:
        db = SessionLocal()
        try:
            face_svc = FaceService(detection_manager.face_adapter)
            embeddings = face_svc.load_known_embeddings(db)
            detection_manager.update_known_embeddings(embeddings)
        finally:
            db.close()
    except Exception as e:
        print(f"Embedding reload error: {e}")


def _make_fingerprint(alert: dict, camera_id: int) -> str:
    vid = str(alert.get("worker_id", "unknown"))
    vtype = str(alert.get("violation_type", "unknown"))
    return f"{vid}:{vtype}:{camera_id}"


def detection_callback(camera_id: int, frame: np.ndarray):
    result = detection_manager.process_frame(frame, camera_id)
    if result:
        alerts = result.get("alerts", [])
        if alerts:
            now = time.time()
            fresh = []
            throttled_count = 0
            with _throttle_lock:
                for a in alerts:
                    fp = _make_fingerprint(a, camera_id)
                    if fp not in _alert_throttle or now >= _alert_throttle[fp]:
                        # This is a NEW violation (not seen within cooldown window)
                        fresh.append(a)
                        _alert_throttle[fp] = now + settings.ALERT_COOLDOWN_SECONDS
                    else:
                        # Duplicate violation - skip to avoid spam
                        throttled_count += 1
            
            if fresh:
                # Only process new violations, skip duplicates within cooldown window
                annotated_frame = result.get("annotated_frame")
                threading.Thread(target=process_detection_result, args=(camera_id, frame, fresh, annotated_frame), daemon=True).start()
            
            if throttled_count > 0:
                # Log throttled violations for debugging
                print(f"[THROTTLE] Camera {camera_id}: {throttled_count} duplicate alert(s) skipped (cooldown: {settings.ALERT_COOLDOWN_SECONDS}s)")
    return result


def auto_start_monitoring():
    global _monitoring_active
    if _monitoring_active:
        return {"message": "Already running", "cameras": []}
    try:
        detection_manager.initialize()
        db = SessionLocal()
        try:
            if detection_manager.face_adapter:
                face_svc = FaceService(detection_manager.face_adapter)
                embeddings = face_svc.load_known_embeddings(db)
                detection_manager.update_known_embeddings(embeddings)
            cameras = db.query(Camera).filter(Camera.is_active == True).limit(settings.MAX_CAMERAS).all()
        finally:
            db.close()

        started = []
        for i, cam in enumerate(cameras):
            video_path = settings.VIDEO_PATHS[i] if i < len(settings.VIDEO_PATHS) else None
            if video_path and not os.path.exists(video_path):
                alt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "..", "videos", f"cam{i+1}.mp4")
                if os.path.exists(alt_path):
                    video_path = alt_path
            if video_path and os.path.exists(video_path):
                stream_manager.start_camera(cam.id, video_path, detection_callback)
                started.append({"camera_id": cam.id, "name": cam.name})
        _monitoring_active = True
        print(f"Auto-started {len(started)} cameras")
        return {"message": f"Started {len(started)} cameras", "cameras": started}
    except Exception as e:
        print(f"Auto-start monitoring error: {e}")
        return {"message": f"Auto-start failed: {e}", "cameras": []}


def _init_models_and_start():
    """Load models and start cameras in background so uvicorn boots immediately."""
    try:
        print("Initializing detection models in background...")
        detection_manager.initialize()
        db = SessionLocal()
        try:
            cameras = db.query(Camera).filter(Camera.is_active == True).limit(settings.MAX_CAMERAS).all()
        finally:
            db.close()
        reload_face_embeddings()
        started = []
        for i, cam in enumerate(cameras):
            video_path = settings.VIDEO_PATHS[i] if i < len(settings.VIDEO_PATHS) else None
            if video_path and not os.path.exists(video_path):
                alt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "..", "videos", f"cam{i+1}.mp4")
                if os.path.exists(alt_path):
                    video_path = alt_path
            if video_path and os.path.exists(video_path):
                stream_manager.start_camera(cam.id, video_path, detection_callback)
                started.append({"camera_id": cam.id, "name": cam.name})
        global _monitoring_active
        _monitoring_active = True
        print(f"Auto-started {len(started)} cameras")
    except Exception as e:
        print(f"Background init error: {e}")


@router.get("/start")
def start_monitoring(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return auto_start_monitoring()


@router.get("/stop")
def stop_monitoring(current_user: User = Depends(get_current_user)):
    global _monitoring_active
    stream_manager.stop_all()
    _monitoring_active = False
    return {"message": "Monitoring stopped"}


@router.get("/reload-embeddings")
def reload_embeddings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if detection_manager.face_adapter:
        face_svc = FaceService(detection_manager.face_adapter)
        embeddings = face_svc.load_known_embeddings(db)
        detection_manager.update_known_embeddings(embeddings)
        return {"message": f"Loaded {len(embeddings)} face embeddings"}
    return {"message": "Face adapter not available"}


@router.post("/switch-video/{camera_id}")
def switch_camera_video(
    camera_id: int,
    video_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Switch a camera's video source to an uploaded video or back to default."""
    from app.database.models import UploadedVideo
    
    if video_id is None:
        # Switch back to default video
        default_index = camera_id - 1
        if default_index < len(settings.VIDEO_PATHS):
            video_path = settings.VIDEO_PATHS[default_index]
        else:
            video_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
                "..", "videos", f"cam{camera_id}.mp4"
            )
        
        if not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail=f"Default video not found: {video_path}")
        
        # Stop and restart camera with default video
        stream_manager.stop_camera(camera_id)
        stream_manager.start_camera(camera_id, video_path, detection_callback)
        
        return {
            "message": f"Camera {camera_id} switched to default video",
            "camera_id": camera_id,
            "video_source": "default"
        }
    
    # Switch to uploaded video
    uploaded_video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
    if not uploaded_video:
        raise HTTPException(status_code=404, detail="Uploaded video not found")
    
    if uploaded_video.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Video is not ready for playback. Current status: {uploaded_video.status}"
        )
    
    video_path = uploaded_video.file_path
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found on disk")
    
    # Stop and restart camera with uploaded video
    stream_manager.stop_camera(camera_id)
    stream_manager.start_camera(camera_id, video_path, detection_callback)
    
    return {
        "message": f"Camera {camera_id} now streaming uploaded video",
        "camera_id": camera_id,
        "video_id": video_id,
        "video_name": uploaded_video.original_name,
        "violations_found": uploaded_video.violations_found
    }


@router.get("/streamable-videos")
def list_streamable_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all completed videos that can be streamed in CCTV."""
    from app.database.models import UploadedVideo
    
    videos = db.query(UploadedVideo).filter(
        UploadedVideo.status == "completed"
    ).order_by(UploadedVideo.created_at.desc()).all()
    
    return {
        "videos": [
            {
                "id": v.id,
                "filename": v.original_name,
                "duration_seconds": v.duration_seconds,
                "violations_found": v.violations_found,
                "processed_at": str(v.processed_at) if v.processed_at else None,
                "camera_id": v.camera_id,
            }
            for v in videos
        ]
    }


@router.get("/evaluate")
def evaluate_face_recognition(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not detection_manager.face_adapter:
        return {"error": "Face adapter not available"}
    adapter = detection_manager.face_adapter
    from app.database.models import Worker, WorkerImage
    workers = db.query(Worker).filter(Worker.is_active == True).all()
    results = []
    confusion = {}
    all_worker_ids = []

    for w in workers:
        wid = w.id
        wname = w.user.full_name if w.user else f"Worker {wid}"
        all_worker_ids.append(wid)
        img = db.query(WorkerImage).filter(WorkerImage.worker_id == wid, WorkerImage.is_primary == True).first()
        if not img or not os.path.exists(img.filepath):
            continue
        import cv2, json, numpy as np
        frame = cv2.imread(img.filepath)
        if frame is None:
            continue
        face_img, bbox, _ = adapter.extract_face(frame)
        if face_img is None:
            continue
        enhanced = _enhance_face(face_img)
        emb = adapter.get_embedding(enhanced)
        if emb is None:
            continue
        row = {"worker_id": wid, "worker_name": wname, "scores": []}
        for w2_id, w2_name, w2_emb in detection_manager.known_embeddings:
            dist = np.linalg.norm(emb - w2_emb)
            sim = float(1.0 / (1.0 + dist))
            row["scores"].append({"against_worker_id": w2_id, "against_worker_name": w2_name, "similarity": round(sim, 4)})
            key = f"{wid}_vs_{w2_id}"
            confusion.setdefault(key, []).append(sim)
        results.append(row)

    matrix = []
    for wid1 in all_worker_ids:
        row_m = {}
        for wid2 in all_worker_ids:
            key = f"{wid1}_vs_{wid2}"
            scores = confusion.get(key, [])
            row_m[str(wid2)] = round(float(np.mean(scores)), 4) if scores else 0
        matrix.append(row_m)

    stats = {"per_worker": results, "confusion_matrix": matrix, "worker_ids": all_worker_ids}
    genuine = []
    impostor = []
    for r in results:
        for s in r["scores"]:
            if s["against_worker_id"] == r["worker_id"]:
                genuine.append(s["similarity"])
            else:
                impostor.append(s["similarity"])
    stats["genuine"] = {"min": round(min(genuine),4), "max": round(max(genuine),4), "avg": round(float(np.mean(genuine)),4)} if genuine else {}
    stats["impostor"] = {"min": round(min(impostor),4), "max": round(max(impostor),4), "avg": round(float(np.mean(impostor)),4)} if impostor else {}
    tp = sum(1 for r in results for s in r["scores"] if s["against_worker_id"] == r["worker_id"] and s["similarity"] >= 0.38)
    fn = sum(1 for r in results for s in r["scores"] if s["against_worker_id"] == r["worker_id"] and s["similarity"] < 0.38)
    fp = sum(1 for r in results for s in r["scores"] if s["against_worker_id"] != r["worker_id"] and s["similarity"] >= 0.38)
    tn = sum(1 for r in results for s in r["scores"] if s["against_worker_id"] != r["worker_id"] and s["similarity"] < 0.38)
    total = tp + tn + fp + fn
    stats["accuracy"] = round((tp + tn) / total, 4) if total else 0
    stats["false_positive_rate"] = round(fp / (fp + tn), 4) if (fp + tn) else 0
    stats["false_negative_rate"] = round(fn / (fn + tp), 4) if (fn + tp) else 0
    stats["true_positives"] = tp
    stats["false_positives"] = fp
    stats["true_negatives"] = tn
    stats["false_negatives"] = fn
    threshold = settings.FACE_MATCH_THRESHOLD
    gap_threshold = settings.FACE_MATCH_MIN_GAP
    stats["threshold_used"] = threshold
    stats["gap_threshold_used"] = gap_threshold
    stats["evaluated_workers"] = len(results)
    return stats


@router.get("/separation-report")
def face_separation_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.database.models import Worker, WorkerImage
    import cv2, numpy as np

    if not detection_manager.face_adapter:
        return {"error": "Face adapter not available"}

    adapter = detection_manager.face_adapter
    workers = db.query(Worker).filter(Worker.is_active == True).all()
    worker_data = []
    for w in workers:
        wid = w.id
        wname = w.user.full_name if w.user else f"Worker {wid}"
        img = db.query(WorkerImage).filter(WorkerImage.worker_id == wid, WorkerImage.is_primary == True).first()
        if not img or not os.path.exists(img.filepath):
            continue
        frame = cv2.imread(img.filepath)
        if frame is None:
            continue
        face_img, bbox, _ = adapter.extract_face(frame)
        if face_img is None:
            continue
        enhanced = _enhance_face(face_img)
        emb = adapter.get_embedding(enhanced)
        if emb is None:
            continue
        worker_data.append({"id": wid, "name": wname, "embedding": emb, "enrollment_image": img.filepath})

    n = len(worker_data)
    labels = [w["name"] for w in worker_data]
    ids = [w["id"] for w in worker_data]
    matrix = [[0.0] * n for _ in range(n)]
    max_cross = 0.0
    max_pair = None
    cross_pairs = []

    for i in range(n):
        for j in range(n):
            dist = np.linalg.norm(worker_data[i]["embedding"] - worker_data[j]["embedding"])
            sim = round(float(1.0 / (1.0 + dist)), 4)
            matrix[i][j] = sim
            if i != j and sim > max_cross:
                max_cross = sim
                max_pair = (labels[i], labels[j])
            if i != j and sim > 0.75:
                cross_pairs.append({
                    "worker_a": labels[i],
                    "worker_id_a": ids[i],
                    "worker_b": labels[j],
                    "worker_id_b": ids[j],
                    "similarity": sim,
                })

    if max_cross > 0.75:
        status = "POOR_IDENTITY_SEPARATION"
        recommendations = [
            "Re-capture enrollment images with better lighting and frontal face",
            "Increase FACE_MATCH_THRESHOLD to reduce false positives (try 0.45-0.50)",
            "Apply face alignment before embedding extraction",
            "Use higher-resolution enrollment photos (min 200x200 px face area)",
            "Consider re-training or replacing the face embedding model",
            "If only 2 workers, consider using separate cameras per worker",
        ]
    elif max_cross > 0.60:
        status = "MODERATE_SEPARATION"
        recommendations = [
            "Monitor assignment distribution for developing bias",
            "Consider re-capturing enrollment images for workers with cross-similarity > 0.60",
            "Current threshold is adequate but watch for edge cases",
        ]
    else:
        status = "GOOD_SEPARATION"
        recommendations = [
            "Identity separation is adequate for current threshold",
            "No changes needed to enrollment images or thresholds",
        ]

    return {
        "status": status,
        "max_cross_similarity": max_cross,
        "max_cross_pair": f"{max_pair[0]} vs {max_pair[1]}" if max_pair else None,
        "cross_pairs_above_threshold": cross_pairs,
        "threshold": settings.FACE_MATCH_THRESHOLD,
        "workers": [{"id": wid, "name": n} for wid, n in zip(ids, labels)],
        "labels": labels,
        "matrix": matrix,
        "recommendations": recommendations,
        "self_similarities": [matrix[i][i] for i in range(n)],
        "cross_similarities": {
            labels[i]: {
                labels[j]: matrix[i][j]
                for j in range(n) if i != j
            }
            for i in range(n)
        },
    }


@router.get("/stream/{camera_id}")
def stream_camera(camera_id: int):
    global _active_streams
    with _streams_lock:
        if _active_streams >= 16:
            return StreamingResponse(content="Too many connections", status_code=503)
        _active_streams += 1

    def generate():
        cached_jpg = None
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        _, blank_jpg = cv2.imencode(".jpg", blank, [cv2.IMWRITE_JPEG_QUALITY, 75])
        blank_frame = blank_jpg.tobytes()
        try:
            while True:
                t0 = time.time()
                frame = stream_manager.get_frame(camera_id)
                if frame is not None:
                    h, w = frame.shape[:2]
                    if h > 480:
                        scale = 480 / h
                        nw = int(w * scale)
                        small = cv2.resize(frame, (nw, 480), interpolation=cv2.INTER_LINEAR)
                    else:
                        small = frame
                    _, buf = cv2.imencode(".jpg", small, [cv2.IMWRITE_JPEG_QUALITY, 75])
                    cached_jpg = buf.tobytes()
                payload = cached_jpg if cached_jpg is not None else blank_frame
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + payload + b"\r\n"
                )
                elapsed = time.time() - t0
                remaining = 0.033 - elapsed
                if remaining > 0:
                    time.sleep(remaining)
        except GeneratorExit:
            raise
        except Exception:
            pass
        finally:
            global _active_streams
            with _streams_lock:
                _active_streams -= 1

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/debug/embeddings")
def debug_embeddings(current_user: User = Depends(get_current_user)):
    emb = detection_manager.known_embeddings
    return {
        "count": len(emb),
        "workers": [
            {
                "worker_id": e[0],
                "worker_name": e[1],
                "embedding_shape": list(e[2].shape) if hasattr(e[2], 'shape') else None,
            }
            for e in emb
        ],
        "face_adapter_ready": detection_manager.face_adapter is not None,
    }


@router.get("/debug/detections")
def get_detection_debug(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.database.models import Violation
    recent = db.query(Violation).order_by(Violation.created_at.desc()).limit(20).all()
    return [
        {
            "id": v.id,
            "camera_id": v.camera_id,
            "violation_type": v.violation_type,
            "worker_id": v.worker_id,
            "status": v.status,
            "confidence": v.confidence,
            "created_at": str(v.created_at),
        }
        for v in recent
    ]


@router.post("/clear-all")
def clear_all_records(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.database.models import Violation, ViolationReviewQueue, Fine, Alert, NotificationHistory, SystemLog, Report
    for model in [NotificationHistory, SystemLog, Report, Alert, ViolationReviewQueue, Fine, Violation]:
        db.query(model).delete()
    db.commit()
    return {"message": "All records cleared"}


@router.get("/status")
def monitoring_status(current_user: User = Depends(get_current_user)):
    states = stream_manager.get_states()
    return {
        "active_cameras": stream_manager.get_active_count(),
        "monitoring": _monitoring_active,
        "cameras": [
            {
                "camera_id": cam_id,
                "is_active": state.is_active,
                "frame_count": state.frame_count,
            }
            for cam_id, state in states.items()
        ],
    }


@router.get("/recognition-metrics")
def recognition_metrics(current_user: User = Depends(get_current_user)):
    return detection_manager.get_recognition_stats()


@router.get("/recognition-stats")
def recognition_stats_full(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.database.models import Violation

    stats = detection_manager.get_recognition_stats()

    violations = db.query(Violation).filter(Violation.worker_id.isnot(None)).all()
    worker_counts = {}
    worker_names: Dict[int, str] = {}
    for v in violations:
        wid = v.worker_id
        worker_counts[wid] = worker_counts.get(wid, 0) + 1
        if wid not in worker_names and v.worker and v.worker.user:
            worker_names[wid] = v.worker.user.full_name

    total_assigned = sum(worker_counts.values()) or 1
    distribution = []
    for wid, count in sorted(worker_counts.items(), key=lambda x: -x[1]):
        pct = round(count / total_assigned * 100, 1)
        w = db.query(Worker).filter(Worker.id == wid).first()
        wname = worker_names.get(wid, w.user.full_name if w and w.user else f"Worker #{wid}")
        distribution.append({
            "worker_id": wid,
            "worker_name": wname,
            "assignments": count,
            "percentage": pct,
        })

    top_worker = distribution[0] if distribution else None
    bias_warning = None
    if top_worker and top_worker["percentage"] > 70:
        bias_warning = {
            "message": f"POSSIBLE RECOGNITION BIAS DETECTED: {top_worker['worker_name']} receives {top_worker['percentage']}% of all assignments ({top_worker['assignments']}/{total_assigned})",
            "worker_id": top_worker["worker_id"],
            "worker_name": top_worker["worker_name"],
            "percentage": top_worker["percentage"],
            "assignments": top_worker["assignments"],
            "total_assigned": total_assigned,
        }

    needs_review_count = db.query(Violation).filter(Violation.needs_review == True).count()
    high_conf_count = db.query(Violation).filter(Violation.confidence_level == "HIGH").count()
    probable_count = db.query(Violation).filter(Violation.confidence_level == "PROBABLE").count()

    return {
        "metrics": stats,
        "distribution": distribution,
        "bias_warning": bias_warning,
        "total_assigned": total_assigned,
        "high_confidence_matches": high_conf_count,
        "probable_matches": probable_count,
        "needs_review": needs_review_count,
        "average_gap": settings.FACE_MATCH_MIN_GAP,
        "threshold": settings.FACE_MATCH_THRESHOLD,
    }


@router.get("/debug/face-quality-stats")
def face_quality_stats(current_user: User = Depends(get_current_user)):
    return get_quality_filter_stats()


@router.post("/debug/face-quality-stats/reset")
def reset_quality_stats(current_user: User = Depends(require_admin)):
    reset_quality_filter_stats()
    return {"message": "Reset"}


@router.get("/face-quality-analytics")
def face_quality_analytics(current_user: User = Depends(get_current_user)):
    return compute_quality_analytics_report()


@router.post("/face-quality-analytics/reset")
def reset_quality_analytics(current_user: User = Depends(require_admin)):
    clear_quality_analytics()
    return {"message": "Analytics cleared"}


@router.get("/debug/face-calibration")
def face_calibration(current_user: User = Depends(get_current_user)):
    return compute_stats()


@router.post("/debug/face-calibrate")
def run_calibration(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.database.models import Worker, WorkerImage
    from app.detection.face.face_service import FaceService
    workers = db.query(Worker).filter(Worker.is_active == True).all()
    embeddings = []
    for w in workers:
        img = db.query(WorkerImage).filter(WorkerImage.worker_id == w.id, WorkerImage.is_primary == True).first()
        if img and img.embedding:
            import json, numpy as np
            try:
                obj = json.loads(img.embedding)
                if isinstance(obj, dict) and "embedding" in obj:
                    emb = np.array(obj["embedding"], dtype=np.float32)
                    embeddings.append((w.id, w.user.full_name if w.user else "Unknown", emb))
            except Exception:
                continue
    from app.detection.face.face_adapter import FaceAdapter
    adapter = detection_manager.face_adapter or FaceAdapter()
    reset_calibration()
    count = 0
    for wid1, wn1, emb1 in embeddings:
        for wid2, wn2, emb2 in embeddings:
            import numpy as np
            dist = np.linalg.norm(emb1 - emb2)
            sim = float(1.0 / (1.0 + dist))
            is_genuine = (wid1 == wid2)
            record_match(wid1, sim, is_genuine)
            count += 1
    stats = compute_stats()
    return {"comparisons": count, "stats": stats}


@router.get("/debug/face-audit")
def face_audit_list(current_user: User = Depends(get_current_user)):
    import glob
    debug_dir = os.path.join(settings.EVIDENCE_DIR, "face_debug")
    if not os.path.exists(debug_dir):
        return {"entries": []}
    metas = sorted(glob.glob(os.path.join(debug_dir, "*_meta.json")), reverse=True)[:100]
    entries = []
    for mpath in metas:
        try:
            with open(mpath) as f:
                meta = json.load(f)
            entries.append(meta)
        except Exception:
            continue
    return {"entries": entries, "count": len(entries)}


@router.get("/debug/face-audit/{filename}")
def face_audit_detail(filename: str, current_user: User = Depends(get_current_user)):
    import glob
    debug_dir = os.path.join(settings.EVIDENCE_DIR, "face_debug")
    meta_path = os.path.join(debug_dir, filename)
    if not os.path.exists(meta_path):
        return {"error": "not found"}
    with open(meta_path) as f:
        meta = json.load(f)
    cam_id = None
    for part in filename.split("_"):
        if part.startswith("cam"):
            try:
                cam_id = int(part.replace("cam", ""))
            except ValueError:
                pass
            break
    if cam_id is not None:
        meta["vote_history"] = detection_manager.get_vote_history(cam_id)
    return meta


@router.get("/debug/face-votes/{camera_id}")
def face_votes(camera_id: int, current_user: User = Depends(get_current_user)):
    return {"votes": detection_manager.get_vote_history(camera_id)}


@router.websocket("/ws")
async def monitoring_websocket(websocket: WebSocket):
    await ws_manager.connect(websocket, "monitoring")
    try:
        while True:
            data = await websocket.receive_text()
            await ws_manager.broadcast("monitoring", json.loads(data))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, "monitoring")


@router.get("/recognition-engine")
def recognition_engine(current_user: User = Depends(get_current_user)):
    return get_recognition_engine_info()


from fastapi import APIRouter
face_runtime_router = APIRouter(prefix="/face", tags=["Face Runtime"])


@face_runtime_router.get("/runtime")
def face_runtime(current_user: User = Depends(get_current_user)):
    info = get_recognition_engine_info()
    info["inference_test"] = is_deepface_inference_ok()
    info["startup_time"] = get_deepface_startup_time()
    return info


@router.websocket("/ws/alerts")
async def alerts_websocket(websocket: WebSocket):
    await ws_manager.connect(websocket, "alerts")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, "alerts")
