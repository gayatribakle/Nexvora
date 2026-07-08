import cv2
import numpy as np
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List, Optional
import datetime

logger = logging.getLogger(__name__)

from app.detection.ppe.ppe_adapter import PPEAdapter
from app.detection.smoking.smoking_adapter import SmokingAdapter
from app.detection.fire.fire_adapter import FireAdapter
from app.detection.face.face_adapter import FaceAdapter
from app.detection.face.face_tracker import FaceTracker


VIOLATION_COLORS = {
    "ppe": (0, 0, 255),
    "smoking": (0, 140, 255),
    "fire": (255, 0, 0),
    "default": (0, 255, 0),
}

PPE_TYPES = {"no_hardhat", "no_safety_vest", "no_mask", "ppe_violation"}


class DetectionManager:
    def __init__(self):
        self.ppe_adapter: Optional[PPEAdapter] = None
        self.smoking_adapter: Optional[SmokingAdapter] = None
        self.fire_adapter: Optional[FireAdapter] = None
        self.face_adapter: Optional[FaceAdapter] = None
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.known_embeddings: List = []
        self._initialized = False
        self._frame_counters: Dict[int, int] = {}
        self._face_cache: Dict[int, dict] = {}
        self._face_miss_counter: Dict[int, int] = {}
        self.face_tracker = FaceTracker(history_size=15, min_weight=4)
        self._recognition_stats = {
            "total_attempts": 0, "matches": 0, "unknown": 0,
            "low_quality": 0, "rejected_threshold": 0, "rejected_gap": 0,
            "avg_similarity": 0.0, "sum_similarity": 0.0,
        }
        self.active_incidents: Dict[tuple, float] = {}
        # Temporal validation for smoking: track consecutive frames with detections
        self.smoking_buffer: Dict[tuple, List] = {}  # (camera_id, worker_id) -> [confidence_scores]
        self.smoking_buffer_max_age: int = 5  # Keep buffer for max 5 frames without detection

    def initialize(self):
        if self._initialized:
            return
        try:
            self.ppe_adapter = PPEAdapter()
            logger.info("PPE adapter loaded successfully")
        except Exception as e:
            logger.error(f"PPE adapter init error: {e}", exc_info=True)
            print(f"PPE adapter init error: {e}")

        try:
            self.smoking_adapter = SmokingAdapter()
            logger.info("Smoking adapter loaded successfully")
        except Exception as e:
            logger.error(f"Smoking adapter init error: {e}", exc_info=True)
            print(f"Smoking adapter init error: {e}")

        try:
            self.fire_adapter = FireAdapter()
            logger.info("Fire adapter loaded successfully")
        except Exception as e:
            logger.error(f"Fire adapter init error: {e}", exc_info=True)
            print(f"Fire adapter init error: {e}")

        try:
            self.face_adapter = FaceAdapter()
            logger.info("Face adapter loaded successfully")
        except Exception as e:
            logger.error(f"Face adapter init error: {e}", exc_info=True)
            print(f"Face adapter init error: {e}")

        self._initialized = True

    def update_known_embeddings(self, embeddings: List):
        self.known_embeddings = embeddings

    def _draw_boxes(self, frame: np.ndarray, detections: list, worker_name: Optional[str] = None):
        h, w = frame.shape[:2]
        _ppe_count = 0
        _smoke_count = 0
        _fire_count = 0

        for det in detections:
            vtype = det.get("violation_type")
            bbox = det.get("bbox")
            conf = det.get("confidence", 0)
            if not bbox:
                continue
            x1, y1, x2, y2 = [int(v) for v in bbox[:4]]

            if vtype in PPE_TYPES:
                color = VIOLATION_COLORS["ppe"]
                _ppe_count += 1
            elif vtype == "smoking":
                color = VIOLATION_COLORS["smoking"]
                _smoke_count += 1
            elif vtype == "fire":
                color = VIOLATION_COLORS["fire"]
                _fire_count += 1
            else:
                color = VIOLATION_COLORS["default"]

            label = vtype.replace("_", " ").title() if vtype else det.get("class_name", "object")
            label += f" {conf:.2f}"

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            cv2.rectangle(frame, (x1, y1 - th - 8), (x1 + tw + 8, y1), color, -1)
            cv2.putText(frame, label, (x1 + 4, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        x0 = 12
        y0 = 24
        line_h = 22
        if _ppe_count:
            cv2.putText(frame, f"PPE: {_ppe_count}", (x0, y0), cv2.FONT_HERSHEY_SIMPLEX, 0.55, VIOLATION_COLORS["ppe"], 2)
            y0 += line_h
        if _smoke_count:
            cv2.putText(frame, f"Smoking: {_smoke_count}", (x0, y0), cv2.FONT_HERSHEY_SIMPLEX, 0.55, VIOLATION_COLORS["smoking"], 2)
            y0 += line_h
        if _fire_count:
            cv2.putText(frame, f"Fire: {_fire_count}", (x0, y0), cv2.FONT_HERSHEY_SIMPLEX, 0.55, VIOLATION_COLORS["fire"], 2)

        if worker_name:
            cv2.putText(frame, f"Worker: {worker_name}", (12, h - 12),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    def process_frame(self, frame: np.ndarray, camera_id: int) -> Dict[str, Any]:
        # Clean up expired active incidents (grace period of 15 seconds)
        import time
        now = time.time()
        expired = [k for k, last_seen in self.active_incidents.items() if now - last_seen > 15.0]
        for k in expired:
            del self.active_incidents[k]

        results = {"camera_id": camera_id, "timestamp": datetime.datetime.utcnow().isoformat(), "detections": [], "annotated_frame": None, "alerts": []}
        if frame is None or frame.size == 0:
            return results

        futures = {}
        for name, adapter in [("ppe", self.ppe_adapter), ("smoking", self.smoking_adapter), ("fire", self.fire_adapter)]:
            if adapter:
                try:
                    futures[name] = self.executor.submit(adapter.detect, frame)
                except Exception as e:
                    print(f"Detection submit error ({name}): {e}")

        all_detections = []
        for model_name, future in futures.items():
            try:
                result = future.result(timeout=30)
                if result:
                    for det in result.get("detections", []):
                        det["model"] = model_name
                        all_detections.append(det)
            except Exception as e:
                print(f"Detection error ({model_name}): {e}")

        results["detections"] = all_detections

        final_frame = frame.copy()

        # Real face recognition using FaceAdapter
        worker_id = None
        worker_name = None
        face_confidence = 0.0
        face_gap = 0.0
        face_confirmed = False
        vote_status = ""
        confidence_level = ""

        if self.face_adapter and self.known_embeddings:
            try:
                face_result = self.face_adapter.identify_worker(frame, camera_id, self.known_embeddings)
                decision = face_result.get("decision", "NO_FACE")
                worker_id = face_result.get("worker_id")
                worker_name = face_result.get("worker_name")
                face_confidence = face_result.get("confidence", 0.0)
                face_gap = face_result.get("gap", 0.0)

                # Update recognition stats
                self._recognition_stats["total_attempts"] += 1
                self._recognition_stats["sum_similarity"] += face_confidence

                if decision == "MATCH":
                    face_confirmed = True
                    vote_status = "CONFIRMED"
                    confidence_level = "HIGH"
                    self._recognition_stats["matches"] += 1
                    # Track vote in face tracker
                    if worker_id:
                        self.face_tracker.record_vote(camera_id, worker_id, worker_name or f"Worker {worker_id}", face_confidence)
                elif decision == "REJECT_GAP":
                    face_confirmed = False
                    vote_status = "PROBABLE"
                    confidence_level = "PROBABLE"
                    self._recognition_stats["rejected_gap"] += 1
                elif decision == "REJECT_THRESHOLD":
                    face_confirmed = False
                    vote_status = "LOW_CONFIDENCE"
                    confidence_level = ""
                    self._recognition_stats["rejected_threshold"] += 1
                elif decision == "NO_FACE":
                    self._recognition_stats["unknown"] += 1
                elif decision == "LOW_QUALITY_FACE":
                    self._recognition_stats["low_quality"] += 1
                elif decision == "EMBEDDING_FAILED":
                    self._recognition_stats["unknown"] += 1
                else:
                    self._recognition_stats["unknown"] += 1

                # Use face tracker voting for more stable identification
                if not face_confirmed and worker_id:
                    tracker_result = self.face_tracker.get_consensus(camera_id)
                    if tracker_result and tracker_result.get("worker_id") == worker_id:
                        # Tracker confirms the same worker over multiple frames
                        if tracker_result.get("weight", 0) >= self.face_tracker.min_weight:
                            face_confirmed = True
                            vote_status = "CONFIRMED_VIA_TRACKER"
                            confidence_level = "HIGH"

            except Exception as e:
                print(f"Face recognition error: {e}")

        results["worker_id"] = worker_id
        results["worker_name"] = worker_name or "Unknown"
        results["face_confidence"] = face_confidence
        results["face_gap"] = face_gap
        results["face_confirmed"] = face_confirmed
        results["vote_status"] = vote_status
        results["confidence_level"] = confidence_level
        results["face_confidence_value"] = face_confidence
        results["face_gap_value"] = face_gap

        self._draw_boxes(final_frame, all_detections, results.get("worker_name"))

        results["annotated_frame"] = final_frame

        import time
        from app.config.settings import settings
        
        now = time.time()
        
        # Separate detections by type
        smoking_detections = [d for d in all_detections if d.get("violation_type") == "smoking"]
        other_detections = [d for d in all_detections if d.get("violation_type") != "smoking"]
        
        # Process smoking violations with temporal validation
        # Build map of current smoking detections
        current_smoking_map = {}  # (camera_id, worker_id) -> confidence
        for det in smoking_detections:
            worker_id = results.get("worker_id")
            key = (camera_id, worker_id)
            current_smoking_map[key] = det.get("confidence", 0.0)
            
            # Update smoking buffer with this detection
            detection_key = (camera_id, worker_id, "smoking")
            if detection_key not in self.smoking_buffer:
                self.smoking_buffer[detection_key] = []
            
            self.smoking_buffer[detection_key].append(det.get("confidence", 0.0))
            
            # Keep only last N frames
            if len(self.smoking_buffer[detection_key]) > settings.SMOKING_TEMPORAL_FRAMES:
                self.smoking_buffer[detection_key] = self.smoking_buffer[detection_key][-settings.SMOKING_TEMPORAL_FRAMES:]
            
            # Check if we have enough consecutive detections to confirm smoking
            if len(self.smoking_buffer[detection_key]) >= settings.SMOKING_TEMPORAL_FRAMES:
                avg_confidence = sum(self.smoking_buffer[detection_key]) / len(self.smoking_buffer[detection_key])
                if avg_confidence >= settings.SMOKING_CONFIDENCE_THRESHOLD * 0.95:
                    if detection_key not in self.active_incidents:
                        # New smoking violation detected (after temporal validation)
                        self.active_incidents[detection_key] = now
                        alert = {
                            "camera_id": camera_id,
                            "violation_type": "smoking",
                            "confidence": avg_confidence,
                            "worker_id": worker_id,
                            "worker_name": results.get("worker_name"),
                            "timestamp": results["timestamp"],
                            "severity": self._get_severity("smoking"),
                            "face_confirmed": results.get("face_confirmed", False),
                            "vote_status": results.get("vote_status", ""),
                            "confidence_level": results.get("confidence_level", ""),
                            "face_confidence": results.get("face_confidence"),
                            "face_gap": results.get("face_gap"),
                        }
                        results["alerts"].append(alert)
                    else:
                        # Update timestamp - smoking is ongoing
                        self.active_incidents[detection_key] = now
        
        # Handle non-smoking violations with immediate detection
        for det in other_detections:
            vtype = det.get("violation_type")
            worker_id = results.get("worker_id")
            key = (camera_id, worker_id, vtype)
            
            if key in self.active_incidents:
                # Already detected - just update timestamp
                self.active_incidents[key] = now
            else:
                # New violation detected
                self.active_incidents[key] = now
                alert = {
                    "camera_id": camera_id,
                    "violation_type": vtype,
                    "confidence": det.get("confidence", 0.0),
                    "worker_id": worker_id,
                    "worker_name": results.get("worker_name"),
                    "timestamp": results["timestamp"],
                    "severity": self._get_severity(vtype),
                    "face_confirmed": results.get("face_confirmed", False),
                    "vote_status": results.get("vote_status", ""),
                    "confidence_level": results.get("confidence_level", ""),
                    "face_confidence": results.get("face_confidence"),
                    "face_gap": results.get("face_gap"),
                }
                results["alerts"].append(alert)
        
        # Decay smoking buffers when no detection occurs for that key
        for detection_key in list(self.smoking_buffer.keys()):
            if detection_key not in [(camera_id, results.get("worker_id"), "smoking")]:
                self.smoking_buffer[detection_key].append(0.0)  # Add no-detection
                if len(self.smoking_buffer[detection_key]) > settings.SMOKING_TEMPORAL_FRAMES:
                    self.smoking_buffer[detection_key] = self.smoking_buffer[detection_key][-settings.SMOKING_TEMPORAL_FRAMES:]
                
                # Remove if buffer shows no recent detections
                if all(c == 0.0 for c in self.smoking_buffer[detection_key]):
                    del self.smoking_buffer[detection_key]

        return results

    def _get_severity(self, violation_type: str) -> str:
        mapping = {
            "fire": "red",
            "smoking": "orange",
            "no_hardhat": "yellow",
            "no_safety_vest": "yellow",
            "no_mask": "yellow",
            "ppe_violation": "yellow",
        }
        return mapping.get(violation_type, "yellow")

    def get_recognition_stats(self) -> Dict[str, Any]:
        s = self._recognition_stats
        avg = (s["sum_similarity"] / s["total_attempts"]) if s["total_attempts"] > 0 else 0.0
        rec_rate = (s["matches"] / s["total_attempts"] * 100) if s["total_attempts"] > 0 else 0.0
        total_rejected = s["rejected_gap"] + s["rejected_threshold"]
        unk_rate = ((s["unknown"] + total_rejected) / s["total_attempts"] * 100) if s["total_attempts"] > 0 else 0.0
        return {
            "total_attempts": s["total_attempts"],
            "matches": s["matches"],
            "unknown": s["unknown"],
            "low_quality": s["low_quality"],
            "rejected_by_threshold": s["rejected_threshold"],
            "rejected_by_gap": s["rejected_gap"],
            "avg_similarity": round(avg, 4),
            "recognition_rate": round(rec_rate, 1),
            "unknown_rate": round(unk_rate, 1),
        }

    def get_vote_history(self, camera_id: int) -> List[Dict]:
        return self.face_tracker.get_vote_history(camera_id)

    def shutdown(self):
        self.executor.shutdown(wait=False)
