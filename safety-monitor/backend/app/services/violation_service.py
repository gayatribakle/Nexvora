import os
import cv2
import datetime
import tempfile
import numpy as np
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List

from app.database.models import Violation, ViolationReviewQueue, Worker, Camera, Alert, SystemLog, Fine, NotificationHistory, Evidence
from app.config.settings import settings


class ViolationService:
    def __init__(self, db: Session):
        self.db = db

    def create_violation(self, data: Dict[str, Any]) -> Optional[Violation]:
        """
        Create a violation record with automatic deduplication.
        
        TWO-LEVEL THROTTLING SYSTEM:
        1. Frame-level throttle (monitoring.py): In-memory cache prevents duplicate alerts from consecutive frames
        2. Database-level throttle (this method): Checks DB for recent violations with same fingerprint
        
        Fingerprint: worker_id:violation_type:camera_id
        If same worker has same violation type on same camera within ALERT_COOLDOWN_SECONDS (900s = 15 min),
        returns None to skip duplicate notification.
        
        Args:
            data: Violation data dict with camera_id, violation_type, worker_id, etc.
            
        Returns:
            Violation object if NEW (not seen within cooldown), None if DUPLICATE/throttled
        """
        fingerprint = self._make_fingerprint(data)
        
        # Check for recent violation with same fingerprint (within cooldown window)
        existing = self.db.query(Violation).filter(
            Violation.fingerprint == fingerprint,
            Violation.created_at >= datetime.datetime.utcnow() - datetime.timedelta(seconds=settings.ALERT_COOLDOWN_SECONDS),
        ).first()
        
        if existing:
            # Duplicate violation within cooldown window - skip to prevent spam
            print(f"[DUPLICATE] Violation {fingerprint} blocked (cooldown {settings.ALERT_COOLDOWN_SECONDS}s, last seen at {existing.created_at})")
            return None

        screenshot_path = None
        frame_to_save = data.get("annotated_frame")
        if frame_to_save is None:
            frame_to_save = data.get("frame")
            
        if frame_to_save is not None:
            screenshot_path = self._save_evidence(frame_to_save, data.get("violation_type", "unknown"))

        site_id = data.get("site_id")

        violation = Violation(
            worker_id=data.get("worker_id"),
            camera_id=data["camera_id"],
            site_id=site_id,
            violation_type=data["violation_type"],
            confidence=data.get("confidence", 0.0),
            evidence_path=screenshot_path,
            screenshot_path=screenshot_path,
            description=data.get("description", ""),
            fingerprint=fingerprint,
            needs_review=data.get("needs_review", False),
            face_confidence=data.get("face_confidence"),
            face_gap=data.get("face_gap"),
            confidence_level=data.get("confidence_level"),
        )
        self.db.add(violation)
        self.db.flush()

        # Create evidence records
        if data.get("frame") is not None:
            self._create_evidence_records(violation.id, data["frame"], data)

        review = ViolationReviewQueue(
            violation_id=violation.id,
        )
        self.db.add(review)

        alert = Alert(
            camera_id=data["camera_id"],
            violation_type=data["violation_type"],
            severity=data.get("severity", "yellow"),
            message=f"{data.get('violation_type', 'Unknown')} detected on Camera {data['camera_id']}",
            worker_name=data.get("worker_name", "Unknown"),
            fingerprint=fingerprint,
            is_emergency=(data.get("violation_type") == "fire"),
        )
        self.db.add(alert)

        log = SystemLog(
            action="violation_created",
            entity_type="violation",
            details=f"Violation {data.get('violation_type')} on Camera {data['camera_id']}",
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(violation)
        
        # Send notification to the worker (if worker_id exists)
        if violation.worker_id:
            try:
                from app.services.notification_service import NotificationService
                worker = self.db.query(Worker).filter(Worker.id == violation.worker_id).first()
                if worker and worker.user_id:
                    notif_svc = NotificationService(self.db)
                    violation_type_display = data.get('violation_type', 'unknown').replace('_', ' ').title()
                    notif_svc.send_notification(
                        user_id=worker.user_id,
                        title=f"New Violation: {violation_type_display}",
                        message=f"A {violation_type_display} violation has been recorded for you. It is pending review.",
                        notification_type="violation",
                        reference_type="violation",
                        reference_id=violation.id,
                    )
            except Exception as e:
                # Don't fail violation creation if notification fails
                print(f"Failed to send worker notification: {e}")
        
        return violation

    def approve_violation(self, violation_id: int, reviewer_id: int) -> Optional[Violation]:
        violation = self.db.query(Violation).filter(Violation.id == violation_id).first()
        if not violation:
            return None

        violation.status = "approved"
        violation.reviewed_at = datetime.datetime.utcnow()
        violation.reviewed_by = reviewer_id

        review = self.db.query(ViolationReviewQueue).filter(
            ViolationReviewQueue.violation_id == violation_id
        ).first()
        if review:
            review.status = "approved"
            review.reviewed_at = datetime.datetime.utcnow()
            review.reviewed_by = reviewer_id

        if violation.worker_id:
            worker = self.db.query(Worker).filter(Worker.id == violation.worker_id).first()
            if worker:
                worker.total_violations += 1

        self.db.commit()
        self.db.refresh(violation)
        return violation

    def reject_violation(self, violation_id: int, reviewer_id: int, reason: str) -> Optional[Violation]:
        violation = self.db.query(Violation).filter(Violation.id == violation_id).first()
        if not violation:
            return None

        violation.status = "rejected"
        violation.reviewed_at = datetime.datetime.utcnow()
        violation.reviewed_by = reviewer_id
        violation.rejection_reason = reason

        review = self.db.query(ViolationReviewQueue).filter(
            ViolationReviewQueue.violation_id == violation_id
        ).first()
        if review:
            review.status = "rejected"
            review.reviewed_at = datetime.datetime.utcnow()
            review.reviewed_by = reviewer_id

        self.db.commit()
        return violation

    def _make_fingerprint(self, data: Dict[str, Any]) -> str:
        vid = str(data.get("worker_id", "unknown"))
        vtype = str(data.get("violation_type", "unknown"))
        cid = str(data.get("camera_id", "unknown"))
        return f"{vid}:{vtype}:{cid}"

    def delete_violation(self, violation_id: int) -> bool:
        violation = self.db.query(Violation).filter(Violation.id == violation_id).first()
        if not violation:
            return False
        self.db.query(ViolationReviewQueue).filter(ViolationReviewQueue.violation_id == violation_id).delete()
        self.db.query(Fine).filter(Fine.violation_id == violation_id).delete()
        self.db.query(NotificationHistory).filter(
            NotificationHistory.reference_type == "violation",
            NotificationHistory.reference_id == violation_id,
        ).delete()
        self.db.query(Alert).filter(
            Alert.fingerprint == violation.fingerprint,
        ).delete()
        self.db.query(Evidence).filter(Evidence.violation_id == violation_id).delete()
        self.db.delete(violation)
        self.db.commit()
        return True

    def _save_evidence(self, frame, violation_type: str) -> str:
        os.makedirs(settings.EVIDENCE_DIR, exist_ok=True)
        ts = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
        filename = f"{violation_type}_{ts}.jpg"
        filepath = os.path.join(settings.EVIDENCE_DIR, filename)
        cv2.imwrite(filepath, frame)

        # Upload to MinIO
        try:
            from app.storage.minio_client import upload_evidence
            with open(filepath, "rb") as f:
                upload_evidence(f.read(), "screenshot", filename, content_type="image/jpeg")
        except Exception:
            pass

        # Return RELATIVE path for web access (not full filesystem path)
        # Frontend will access via: /uploads/evidence/filename.jpg
        return f"/uploads/evidence/{filename}"

    def _create_evidence_records(self, violation_id: int, frame: np.ndarray, data: Dict[str, Any]):
        """Create multiple evidence records for a violation: screenshot, person crop, face crop."""
        ts = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
        violation_type = data.get("violation_type", "unknown")

        # 1. Full frame screenshot (already saved via _save_evidence)
        screenshot_path = data.get("screenshot_path") or self._get_latest_screenshot(violation_type, ts)
        if screenshot_path:
            self._add_evidence_record(violation_id, "screenshot", screenshot_path, f"Full frame screenshot for {violation_type}")

        # 2. Person crop from detection bounding box
        detections = data.get("detections", [])
        if detections:
            for i, det in enumerate(detections[:3]):  # Limit to 3 crops
                bbox = det.get("bbox")
                if bbox and frame is not None:
                    try:
                        h, w = frame.shape[:2]
                        x1, y1, x2, y2 = [int(max(0, min(v, w if j % 2 == 0 else h))) for j, v in enumerate(bbox[:4])]
                        if x2 > x1 and y2 > y1:
                            person_crop = frame[y1:y2, x1:x2]
                            if person_crop.size > 0:
                                crop_filename = f"{violation_type}_person_{ts}_{i}.jpg"
                                crop_path = os.path.join(settings.EVIDENCE_DIR, crop_filename)
                                cv2.imwrite(crop_path, person_crop)
                                self._add_evidence_record(violation_id, "person_crop", crop_path, f"Person crop {i+1}")
                                # Upload to MinIO
                                self._upload_evidence_to_minio(person_crop, "person_crop", crop_filename)
                    except Exception as e:
                        print(f"Person crop error: {e}")

        # 3. Face crop using face detection
        try:
            from app.detection.face.face_adapter import FaceAdapter
            face_adapter = FaceAdapter()
            face_img, face_bbox, _ = face_adapter.extract_face(frame)
            if face_img is not None and face_bbox is not None:
                face_filename = f"{violation_type}_face_{ts}.jpg"
                face_path = os.path.join(settings.EVIDENCE_DIR, face_filename)
                cv2.imwrite(face_path, face_img)
                self._add_evidence_record(violation_id, "face_crop", face_path, "Detected face crop")
                self._upload_evidence_to_minio(face_img, "face_crop", face_filename)
        except Exception as e:
            print(f"Face crop evidence error: {e}")

        # 4. Video clip extraction (stored as path reference, extracted later)
        video_source = data.get("video_source")
        frame_timestamp = data.get("frame_timestamp")
        if video_source and frame_timestamp:
            clip_filename = f"{violation_type}_clip_{ts}.mp4"
            clip_path = os.path.join(settings.EVIDENCE_DIR, clip_filename)
            # Extract clip asynchronously or on demand
            self._add_evidence_record(violation_id, "video_clip", clip_path,
                                      f"Video clip around {frame_timestamp}", video_source=video_source)

    def _add_evidence_record(self, violation_id: int, evidence_type: str, file_path: str,
                             description: str = "", video_source: str = None):
        """Create an Evidence record in the database."""
        minio_key = None
        if evidence_type in ("screenshot", "person_crop", "face_crop"):
            # Construct the expected MinIO key
            minio_key = f"evidence/{evidence_type}/{os.path.basename(file_path)}"

        evidence = Evidence(
            violation_id=violation_id,
            evidence_type=evidence_type,
            file_path=file_path,
            minio_key=minio_key,
            description=description,
        )
        self.db.add(evidence)

    def _upload_evidence_to_minio(self, img: np.ndarray, evidence_type: str, filename: str):
        """Upload an image to MinIO as evidence."""
        try:
            from app.storage.minio_client import upload_evidence
            _, buf = cv2.imencode(".jpg", img)
            upload_evidence(buf.tobytes(), evidence_type, filename, content_type="image/jpeg")
        except Exception:
            pass  # MinIO is optional

    def _get_latest_screenshot(self, violation_type: str, ts: str) -> Optional[str]:
        """Get the path of the most recently saved screenshot."""
        filename = f"{violation_type}_{ts}.jpg"
        filepath = os.path.join(settings.EVIDENCE_DIR, filename)
        if os.path.exists(filepath):
            return filepath
        return None

    def extract_video_clip(self, violation_id: int, clip_seconds: int = None) -> Optional[str]:
        """Extract a video clip around the violation timestamp."""
        violation = self.db.query(Violation).filter(Violation.id == violation_id).first()
        if not violation:
            return None

        clip_seconds = clip_seconds or settings.EVIDENCE_VIDEO_CLIP_SECONDS

        # Find video clip evidence record
        clip_evidence = self.db.query(Evidence).filter(
            Evidence.violation_id == violation_id,
            Evidence.evidence_type == "video_clip",
        ).first()
        if not clip_evidence:
            return None

        # The video_source would be stored in description or we need the camera's video path
        camera = violation.camera
        if not camera or not camera.video_path:
            return None

        try:
            cap = cv2.VideoCapture(camera.video_path)
            if not cap.isOpened():
                return None

            fps = cap.get(cv2.CAP_PROP_FPS)
            violation_time = violation.detected_at
            start_time = (violation_time - datetime.timedelta(seconds=clip_seconds)).timestamp()
            end_time = (violation_time + datetime.timedelta(seconds=clip_seconds)).timestamp()

            start_frame = int(start_time * fps)
            end_frame = int(end_time * fps)

            cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out = cv2.VideoWriter(clip_evidence.file_path, fourcc, fps, (int(cap.get(3)), int(cap.get(4))))

            for frame_num in range(start_frame, end_frame):
                ret, frame = cap.read()
                if not ret:
                    break
                out.write(frame)

            cap.release()
            out.release()

            # Upload to MinIO
            try:
                from app.storage.minio_client import upload_evidence
                with open(clip_evidence.file_path, "rb") as f:
                    minio_key = upload_evidence(f.read(), "video_clip",
                                                os.path.basename(clip_evidence.file_path),
                                                content_type="video/mp4")
                clip_evidence.minio_key = minio_key
                self.db.commit()
            except Exception:
                pass

            return clip_evidence.file_path
        except Exception as e:
            print(f"Video clip extraction error: {e}")
            return None