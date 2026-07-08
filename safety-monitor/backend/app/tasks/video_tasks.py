import cv2
import os
import datetime
import logging
from sqlalchemy.orm import Session

# Make Celery optional
try:
    from celery import shared_task
    HAS_CELERY = True
except ImportError:
    HAS_CELERY = False
    # Dummy decorator for when Celery is not available
    def shared_task(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

from app.database.session import SessionLocal
from app.database.models import UploadedVideo, Violation
from app.config.settings import settings

logger = logging.getLogger(__name__)


def get_video_duration_fps(video_path: str):
    """Get video duration and FPS using OpenCV."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return 0, 0
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if fps > 0 else 0
    cap.release()
    return duration, fps


@shared_task(bind=True, max_retries=2)
def process_video_task(self, video_id: int):
    """Process an uploaded video: extract frames and run violation detection."""
    db: Session = SessionLocal()
    try:
        video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
        if not video:
            logger.error(f"Video {video_id} not found")
            return {"status": "error", "message": "Video not found"}

        video.status = "processing"
        video.processing_started_at = datetime.datetime.utcnow()
        db.commit()

        video_path = video.file_path
        if not os.path.exists(video_path):
            video.status = "failed"
            video.processing_error = "Video file not found on disk"
            db.commit()
            return {"status": "error", "message": "File not found"}

        # Initialize detection manager
        from app.detection.detection_manager import DetectionManager
        detection_mgr = DetectionManager()
        detection_mgr.initialize()

        # Load face embeddings
        try:
            from app.detection.face.face_service import FaceService
            face_svc = FaceService(detection_mgr.face_adapter)
            embeddings = face_svc.load_known_embeddings(db)
            detection_mgr.update_known_embeddings(embeddings)
        except Exception as e:
            logger.warning(f"Could not load face embeddings: {e}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            video.status = "failed"
            video.processing_error = "Cannot open video file"
            db.commit()
            return {"status": "error", "message": "Cannot open video"}

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        process_fps = settings.VIDEO_PROCESSING_FPS
        frame_interval = int(fps / process_fps) if process_fps > 0 and fps > 0 else 1

        frame_count = 0
        processed_count = 0
        violations_found = 0

        # Import callback for processing results
        from app.api.monitoring import process_detection_result

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1

            if frame_count % frame_interval != 0:
                continue

            # Run detection
            result = detection_mgr.process_frame(frame, video.camera_id or 1)
            processed_count += 1

            if result and result.get("alerts"):
                violations_found += len(result["alerts"])
                # Process each alert (create violation, fine, notification)
                process_detection_result(video.camera_id or 1, frame, result["alerts"])

            # Update progress
            if total_frames > 0:
                progress = min(100.0, (frame_count / total_frames) * 100)
                video.processing_progress = round(progress, 1)
                if processed_count % 10 == 0:
                    db.commit()

        cap.release()
        detection_mgr.shutdown()

        video.status = "completed"
        video.processing_progress = 100.0
        video.processed_at = datetime.datetime.utcnow()
        video.total_frames = total_frames
        video.frames_processed = processed_count
        video.violations_found = violations_found
        db.commit()

        logger.info(f"Video {video_id} processed: {processed_count} frames, {violations_found} violations")
        return {"status": "completed", "violations_found": violations_found}

    except Exception as e:
        logger.error(f"Video processing error: {e}")
        try:
            video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
            if video:
                video.status = "failed"
                video.processing_error = str(e)
                db.commit()
        except Exception:
            pass
        raise self.retry(exc=e, countdown=60)

    finally:
        db.close()


@shared_task
def get_video_processing_status(video_id: int):
    """Get the current processing status of a video."""
    db = SessionLocal()
    try:
        video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
        if not video:
            return {"status": "not_found"}
        return {
            "status": video.status,
            "progress": video.processing_progress,
            "error": video.processing_error,
            "violations_found": video.violations_found,
            "frames_processed": video.frames_processed,
        }
    finally:
        db.close()


def process_video_sync(video_id: int):
    """Synchronous video processing (no Celery dependency).
    
    This is a wrapper around the core processing logic that works
    without Celery. It handles the video processing inline.
    """
    db: Session = SessionLocal()
    try:
        logger.info(f"=" * 60)
        logger.info(f"STARTING VIDEO PROCESSING - Video ID: {video_id}")
        logger.info(f"=" * 60)
        
        video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
        if not video:
            logger.error(f"Video {video_id} not found")
            raise ValueError(f"Video {video_id} not found")

        logger.info(f"Video: {video.original_name}")
        logger.info(f"File path: {video.file_path}")
        logger.info(f"Camera ID: {video.camera_id}")

        video.status = "processing"
        video.processing_started_at = datetime.datetime.utcnow()
        video.processing_progress = 0.0
        video.processing_error = None
        db.commit()

        video_path = video.file_path
        if not os.path.exists(video_path):
            video.status = "failed"
            video.processing_error = "Video file not found on disk"
            db.commit()
            raise FileNotFoundError(f"Video file not found: {video_path}")

        logger.info(f"✓ Video file exists on disk")

        # Initialize detection manager
        logger.info("Initializing AI detection models...")
        from app.detection.detection_manager import DetectionManager
        detection_mgr = DetectionManager()
        detection_mgr.initialize()
        logger.info("✓ AI models loaded successfully")
        logger.info(f"  - PPE Detection: {'✓' if detection_mgr.ppe_adapter else '✗'}")
        logger.info(f"  - Smoking Detection: {'✓' if detection_mgr.smoking_adapter else '✗'}")
        logger.info(f"  - Fire Detection: {'✓' if detection_mgr.fire_adapter else '✗'}")
        logger.info(f"  - Face Recognition: {'✓' if detection_mgr.face_adapter else '✗'}")

        # Load face embeddings
        try:
            from app.detection.face.face_service import FaceService
            face_svc = FaceService(detection_mgr.face_adapter)
            embeddings = face_svc.load_known_embeddings(db)
            detection_mgr.update_known_embeddings(embeddings)
            logger.info(f"✓ Loaded {len(embeddings)} face embeddings for worker recognition")
        except Exception as e:
            logger.warning(f"Could not load face embeddings: {e}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            video.status = "failed"
            video.processing_error = "Cannot open video file"
            db.commit()
            raise ValueError(f"Cannot open video file: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        process_fps = settings.VIDEO_PROCESSING_FPS
        frame_interval = int(fps / process_fps) if process_fps > 0 and fps > 0 else 1
        
        duration = total_frames / fps if fps > 0 else 0
        logger.info(f"\nVideo Properties:")
        logger.info(f"  - Total frames: {total_frames}")
        logger.info(f"  - FPS: {fps:.2f}")
        logger.info(f"  - Duration: {duration:.2f} seconds")
        logger.info(f"  - Processing at: {process_fps} FPS (every {frame_interval} frames)")
        logger.info(f"  - Frames to process: {total_frames // frame_interval}\n")

        frame_count = 0
        processed_count = 0
        violations_found = 0
        
        # Import callback for processing results
        from app.api.monitoring import process_detection_result
        
        # Debug: create folder for annotated frames
        debug_dir = os.path.join(settings.UPLOAD_DIR, "debug_frames", f"video_{video_id}")
        os.makedirs(debug_dir, exist_ok=True)
        logger.info(f"Saving debug frames to: {debug_dir}")
        
        logger.info("Starting frame-by-frame AI detection...\n")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                logger.info("\n\u2713 Reached end of video")
                break
            frame_count += 1
        
            if frame_count % frame_interval != 0:
                continue
        
            # Run detection
            result = detection_mgr.process_frame(frame, video.camera_id or 1)
            processed_count += 1
        
            # Log ALL detections (including non-violation like Person, Hardhat, etc.)
            detections = result.get("detections", []) if result else []
            alerts = result.get("alerts", []) if result else []
        
            logger.info(f"Frame {frame_count}/{total_frames} (processed #{processed_count}):")
            if detections:
                logger.info(f"  - Total model detections: {len(detections)}")
                for det in detections:
                    cls = det.get('class_name', '?')
                    conf = det.get('confidence', 0)
                    vtype = det.get('violation_type', 'NONE')
                    logger.info(f"    \u2022 class={cls} conf={conf:.3f} violation_type={vtype}")
            else:
                logger.info(f"  - No model detections on this frame")
        
            # Save annotated frame to debug folder
            annotated = result.get("annotated_frame") if result else None
            is_violation = bool(result and result.get("alerts"))
            if annotated is not None:
                prefix = "violation_" if is_violation else "frame_"
                frame_path = os.path.join(debug_dir, f"{prefix}{frame_count:06d}.jpg")
                cv2.imwrite(frame_path, annotated)
        
            # Also save raw frame for comparison
            raw_path = os.path.join(debug_dir, f"raw_{frame_count:06d}.jpg")
            cv2.imwrite(raw_path, frame)
        
            if result and result.get("alerts"):
                violations_found += len(result["alerts"])
                logger.info(f"  \u26a0 ALERTS: {len(result['alerts'])} violations found!")
                for alert in result['alerts']:
                    logger.info(f"    \u26a0 {alert.get('violation_type')} - {alert.get('severity')} severity")
                # Process each alert (create violation, fine, notification)
                process_detection_result(video.camera_id or 1, frame, result["alerts"])
            else:
                logger.info(f"  - No violation alerts from this frame")
        
            # Update progress
            if total_frames > 0:
                progress = min(100.0, (frame_count / total_frames) * 100)
                video.processing_progress = round(progress, 1)
                if processed_count % 10 == 0:
                    db.commit()
                    logger.info(f"Progress: {progress:.1f}% ({processed_count} frames processed, {violations_found} violations)")
        
        cap.release()
        detection_mgr.shutdown()
        
        logger.info(f"\nDebug frames saved to: {debug_dir}")
        logger.info(f"Open these images to see what the AI detected on each frame")

        video.status = "completed"
        video.processing_progress = 100.0
        video.processed_at = datetime.datetime.utcnow()
        video.total_frames = total_frames
        video.frames_processed = processed_count
        video.violations_found = violations_found
        db.commit()

        logger.info(f"\n" + "=" * 60)
        logger.info(f"PROCESSING COMPLETE")
        logger.info(f"=" * 60)
        logger.info(f"Video: {video.original_name}")
        logger.info(f"Frames processed: {processed_count}/{total_frames}")
        logger.info(f"Total violations found: {violations_found}")
        logger.info(f"Status: {video.status}")
        logger.info(f"=" * 60 + "\n")
        
        return {"status": "completed", "violations_found": violations_found}

    except Exception as e:
        logger.error(f"\n❌ VIDEO PROCESSING FAILED!")
        logger.error(f"Error: {e}")
        logger.error(f"Traceback:", exc_info=True)
        try:
            video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
            if video:
                video.status = "failed"
                video.processing_error = str(e)
                db.commit()
                logger.error(f"Video status set to 'failed' with error message")
        except Exception:
            pass
        raise

    finally:
        db.close()
