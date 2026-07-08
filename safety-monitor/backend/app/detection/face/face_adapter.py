import os
import sys
import cv2
import json
import time
import warnings
import threading
from datetime import datetime
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sklearn.preprocessing import Normalizer

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

from app.config.settings import settings

_STDERR = sys.stderr
_deepface_backend = None
_deepface_import_attempted = False
_torch_facenet = None
_torch_facenet_lock = threading.Lock()

_FACE_DEBUG_DIR = os.path.join(settings.EVIDENCE_DIR, "face_debug")
os.makedirs(_FACE_DEBUG_DIR, exist_ok=True)

_quality_filter_stats = {"skipped_small": 0, "skipped_blurry": 0, "skipped_dark": 0, "passed": 0}

_runtime_engine: str = "unknown"
_runtime_engine_lock = threading.Lock()
_deepface_startup_time: Optional[float] = None
_deepface_inference_pass: bool = False


def _set_runtime_engine(engine: str):
    global _runtime_engine
    with _runtime_engine_lock:
        _runtime_engine = engine


def run_deepface_inference_test() -> bool:
    """Test that DeepFace can actually generate an embedding."""
    import cv2, numpy as np
    try:
        dummy = np.zeros((160, 160, 3), dtype=np.uint8)
        from deepface import DeepFace
        emb = DeepFace.represent(
            img_path=dummy,
            model_name='Facenet512',
            detector_backend='skip',
            enforce_detection=False,
            normalization='base',
        )
        return len(emb) > 0 and len(emb[0]['embedding']) == 512
    except Exception as e:
        print(f"[FaceAdapter] Inference test FAILED: {e}")
        return False


def get_recognition_engine_info() -> Dict:
    df = _get_deepface() is not None
    with _runtime_engine_lock:
        last_engine = _runtime_engine
    if df:
        engine_name = "deepface"
        model_name = "Facenet512"
        try:
            import deepface as _df_pkg
            model_source = getattr(_df_pkg, '__file__', 'pip-installed')
        except Exception:
            model_source = os.path.join(settings.DEEPFACE_PATH, "deepface", "DeepFace.py")
        emb_dim = 512
        fallback = False
        deepface_ok = True
    else:
        engine_name = "none"
        model_name = "none"
        model_source = "none"
        emb_dim = 0
        fallback = False
        deepface_ok = False

    return {
        "recognition_engine": engine_name,
        "model_name": model_name,
        "model_source_file": model_source,
        "embedding_dimension": emb_dim,
        "deepface_initialized": df,
        "fallback_active": fallback,
        "last_used_engine": last_engine,
        "torch_facenet_loaded": False,
        "inference_test": _deepface_inference_pass,
        "startup_time": _deepface_startup_time,
    }

_quality_analytics: List[Dict] = []
MAX_QUALITY_ANALYTICS = 500


def record_quality_attempt(data: Dict):
    global _quality_analytics
    _quality_analytics.append(data)
    if len(_quality_analytics) > MAX_QUALITY_ANALYTICS:
        _quality_analytics = _quality_analytics[-MAX_QUALITY_ANALYTICS:]


def get_deepface_startup_time() -> Optional[float]:
    return _deepface_startup_time


def is_deepface_inference_ok() -> bool:
    return _deepface_inference_pass


def get_quality_analytics() -> List[Dict]:
    return list(_quality_analytics)


def clear_quality_analytics():
    global _quality_analytics
    _quality_analytics = []


def compute_quality_analytics_report() -> Dict:
    data = _quality_analytics
    if not data:
        return {
            "total_attempts": 0,
            "avg_face_width": 0, "min_face_width": 0,
            "avg_face_height": 0, "min_face_height": 0,
            "avg_blur": 0, "avg_brightness": 0,
            "avg_similarity": 0,
            "tiny_faces": 0, "blurry_faces": 0, "dark_faces": 0,
            "flagged_entries": [],
            "correlation_data": [],
            "width_buckets": {},
        }

    widths = [d["face_width"] for d in data if d.get("face_width")]
    heights = [d["face_height"] for d in data if d.get("face_height")]
    blurs = [d["blur_score"] for d in data if d.get("blur_score")]
    brightnesses = [d["brightness"] for d in data if d.get("brightness")]
    sims = [d["similarity"] for d in data if d.get("similarity") is not None]

    tiny = [d for d in data if d.get("face_width", 0) < 80 or d.get("face_height", 0) < 80]
    blurry = [d for d in data if d.get("blur_score", 100) < 15]
    dark = [d for d in data if d.get("brightness", 128) < 30 or d.get("brightness", 128) > 240]

    width_buckets = {}
    for d in data:
        w = d.get("face_width", 0)
        if w <= 0: continue
        bucket = (w // 20) * 20
        bucket_label = f"{bucket}-{bucket+19}"
        width_buckets.setdefault(bucket_label, {"count": 0, "sims": []})
        width_buckets[bucket_label]["count"] += 1
        if d.get("similarity") is not None:
            width_buckets[bucket_label]["sims"].append(d["similarity"])

    for k in width_buckets:
        s = width_buckets[k]["sims"]
        width_buckets[k]["avg_similarity"] = round(sum(s) / len(s), 4) if s else 0
        del width_buckets[k]["sims"]

    return {
        "total_attempts": len(data),
        "avg_face_width": round(float(np.mean(widths)), 1) if widths else 0,
        "min_face_width": int(min(widths)) if widths else 0,
        "avg_face_height": round(float(np.mean(heights)), 1) if heights else 0,
        "min_face_height": int(min(heights)) if heights else 0,
        "avg_blur": round(float(np.mean(blurs)), 1) if blurs else 0,
        "avg_brightness": round(float(np.mean(brightnesses)), 1) if brightnesses else 0,
        "avg_similarity": round(float(np.mean(sims)), 4) if sims else 0,
        "tiny_faces": len(tiny),
        "blurry_faces": len(blurry),
        "dark_faces": len(dark),
        "flagged_entries": [
            {
                "timestamp": d.get("timestamp"),
                "camera_id": d.get("camera_id"),
                "face_width": d.get("face_width"),
                "face_height": d.get("face_height"),
                "blur_score": d.get("blur_score"),
                "brightness": d.get("brightness"),
                "similarity": d.get("similarity"),
                "assigned_worker": d.get("assigned_worker"),
                "flags": "TINY" if d.get("face_width", 0) < 80 else "BLURRY" if d.get("blur_score", 100) < 15 else "DARK" if d.get("brightness", 128) < 30 else "",
            }
            for d in tiny + blurry + dark
        ][:100],
        "correlation_data": [
            {
                "face_width": d.get("face_width"),
                "face_height": d.get("face_height"),
                "blur_score": d.get("blur_score"),
                "brightness": d.get("brightness"),
                "face_area_percent": d.get("face_area_percent"),
                "similarity": d.get("similarity"),
                "assigned_worker": d.get("assigned_worker"),
                "decision": d.get("decision"),
            }
            for d in data[-200:]
        ],
        "width_buckets": dict(sorted(width_buckets.items())),
    }


def _quiet_stderr():
    sys.stderr = open(os.devnull, "w")
    warnings.filterwarnings("ignore", category=DeprecationWarning)


def _restore_stderr():
    sys.stderr = _STDERR


def _get_deepface():
    """Import DeepFace directly in the main thread.
    TF 2.x DLL initialization fails (0x45A) if called from a background thread.
    We cache the module singleton so model weights load only once.
    Prefers pip-installed deepface over local deepface-master."""
    global _deepface_backend, _deepface_startup_time, _deepface_import_attempted
    if _deepface_import_attempted:
        return _deepface_backend
    _deepface_import_attempted = True
    t0 = time.time()
    try:
        # Try pip-installed deepface first (supports weight downloads)
        from deepface import DeepFace
        _deepface_backend = DeepFace
        _deepface_startup_time = round(time.time() - t0, 2)
        print(f"[FaceAdapter] DeepFace (pip) import OK in {_deepface_startup_time}s")
        return _deepface_backend
    except ImportError:
        pass
    except Exception as e:
        print(f"[FaceAdapter] DeepFace (pip) import failed: {e}, trying local...")
    # Fallback: try local deepface-master
    deepface_path = settings.DEEPFACE_PATH
    if os.path.exists(deepface_path) and deepface_path not in sys.path:
        sys.path.insert(0, deepface_path)
    try:
        import importlib
        importlib.import_module('deepface')
        from deepface import DeepFace
        _deepface_backend = DeepFace
        _deepface_startup_time = round(time.time() - t0, 2)
        print(f"[FaceAdapter] DeepFace (local) import OK in {_deepface_startup_time}s")
        return _deepface_backend
    except Exception as e:
        t = round(time.time() - t0, 2)
        _deepface_startup_time = -t
        print(f"[FaceAdapter] DeepFace import FAILED after {t}s: {e}")
        return None


def _warmup_deepface():
    """Initialize DeepFace on the main thread and run inference test.
    Must be called from the MAIN thread — TF DLL fails in background threads."""
    global _deepface_inference_pass
    df = _get_deepface()
    if df is None:
        print("[FaceAdapter] WARMUP FAILED — DeepFace not available")
        _deepface_inference_pass = False
        return
    import cv2, numpy as np
    try:
        dummy = np.zeros((160, 160, 3), dtype=np.uint8)
        emb = df.represent(
            img_path=dummy,
            model_name='Facenet512',
            detector_backend='skip',
            enforce_detection=False,
            normalization='base',
        )
        if emb and len(emb) > 0 and len(emb[0]['embedding']) == 512:
            _deepface_inference_pass = True
            print(f"[FaceAdapter] WARMUP PASS — inference test OK (512-d embedding)")
        else:
            print(f"[FaceAdapter] WARMUP FAILED — inference test returned bad shape")
            _deepface_inference_pass = False
    except Exception as e:
        print(f"[FaceAdapter] WARMUP FAILED — inference test error: {e}")
        _deepface_inference_pass = False


def _compute_blur_score(img: np.ndarray) -> float:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def _compute_brightness(img: np.ndarray) -> float:
    return float(np.mean(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)))


def _enhance_face(face_img: np.ndarray) -> np.ndarray:
    enhanced = face_img.copy()
    lab = cv2.cvtColor(enhanced, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    brightness = _compute_brightness(enhanced)
    if brightness < 80:
        enhanced = cv2.convertScaleAbs(enhanced, alpha=1.3, beta=20)
    elif brightness > 200:
        enhanced = cv2.convertScaleAbs(enhanced, alpha=0.8, beta=-10)
    kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]], dtype=np.float32)
    enhanced = cv2.filter2D(enhanced, -1, kernel)
    return enhanced


def _save_debug_images(timestamp: str, camera_id: int,
                       original_crop: np.ndarray, raw_face: np.ndarray,
                       enhanced_face: np.ndarray, result: Dict[str, Any]):
    ts = timestamp.replace(":", "-").replace(".", "-")
    prefix = f"cam{camera_id}_{ts}"
    raw_path = os.path.join(_FACE_DEBUG_DIR, f"{prefix}_raw_face.jpg")
    enhanced_path = os.path.join(_FACE_DEBUG_DIR, f"{prefix}_enhanced_face.jpg")
    cv2.imwrite(raw_path, raw_face)
    cv2.imwrite(enhanced_path, enhanced_face)
    meta = {
        "timestamp": timestamp,
        "camera_id": camera_id,
        "worker_id": result.get("worker_id"),
        "worker_name": result.get("worker_name"),
        "confidence": result.get("confidence", 0.0),
        "quality": result.get("quality", {}),
        "decision": result.get("decision", "unknown"),
        "raw_face_path": raw_path,
        "enhanced_face_path": enhanced_path,
        "raw_face_url": f"/uploads/evidence/face_debug/{prefix}_raw_face.jpg",
        "enhanced_face_url": f"/uploads/evidence/face_debug/{prefix}_enhanced_face.jpg",
        "bbox": result.get("bbox"),
    }
    meta_path = os.path.join(_FACE_DEBUG_DIR, f"{prefix}_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    if original_crop is not None:
        crop_path = os.path.join(_FACE_DEBUG_DIR, f"{prefix}_frame_crop.jpg")
        cv2.imwrite(crop_path, original_crop)


def get_quality_filter_stats():
    return dict(_quality_filter_stats)


def reset_quality_filter_stats():
    for k in _quality_filter_stats:
        _quality_filter_stats[k] = 0


class FaceAdapter:
    def __init__(self):
        self.model = None
        self.embedding_size = 128
        self.l2_normalizer = Normalizer('l2')

    @property
    def backend(self):
        return _get_deepface()

    def _detect_faces_haar(self, frame: np.ndarray, min_size: int = 40) -> Tuple[Optional[np.ndarray], Optional[list]]:
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        
        cascades = [
            "haarcascade_frontalface_default.xml",
            "haarcascade_frontalface_alt2.xml",
            "haarcascade_frontalface_alt.xml",
            "haarcascade_profileface.xml"
        ]
        
        for name in cascades:
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + name)
            faces = face_cascade.detectMultiScale(gray, 1.1, 3, minSize=(min_size, min_size))
            if len(faces) > 0:
                x, y, fw, fh = faces[0]
                margin = int(fw * 0.40)
                x1 = max(0, x - margin)
                y1 = max(0, y - int(margin * 1.2))
                x2 = min(w, x + fw + margin)
                y2 = min(h, y + fh + int(margin * 0.8))
                face_img = frame[y1:y2, x1:x2]
                face_img = cv2.resize(face_img, (160, 160))
                return face_img, [x1, y1, x2, y2]
        return None, None

    def extract_face(self, frame: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[list], Optional[np.ndarray]]:
        h, w = frame.shape[:2]
        backend = self.backend
        if backend is not None:
            try:
                _quiet_stderr()
                try:
                    faces = backend.extract_faces(
                        img_path=frame,
                        detector_backend='opencv',
                        enforce_detection=False,
                    )
                finally:
                    _restore_stderr()
                if faces:
                    for face_data in faces:
                        try:
                            face_img = face_data["face"]
                            # Handle both old ('area') and new ('facial_area') API
                            area = face_data.get("area", face_data.get("facial_area", {}))
                            x = int(area.get("x", 0))
                            y = int(area.get("y", 0))
                            fw = int(area.get("w", frame.shape[1]))
                            fh = int(area.get("h", frame.shape[0]))
                            conf = face_data.get("confidence", 0)
                            if conf < 0.3:
                                continue
                            bbox = [x, y, x + fw, y + fh]
                            crop = frame[max(0, y):min(h, y + fh), max(0, x):min(w, x + fw)]
                            # Resize to 160x160 (new DeepFace doesn't have target_size)
                            if face_img.shape[:2] != (160, 160):
                                face_img = cv2.resize(face_img, (160, 160))
                            
                            # Convert face_img to uint8 [0, 255] if it's float from DeepFace
                            if face_img.dtype != np.uint8:
                                if np.max(face_img) <= 1.0:
                                    face_img = (face_img * 255.0).astype(np.uint8)
                                else:
                                    face_img = face_img.astype(np.uint8)

                            return face_img, bbox, crop
                        except Exception:
                            continue
            except Exception:
                pass

        scale = 480 / max(h, w)
        small = cv2.resize(frame, (int(w * scale), int(h * scale)))
        result = self._detect_faces_haar(small)
        if result[0] is not None:
            bbox = result[1]
            inv = 1.0 / scale
            scaled = [int(bbox[0] * inv), int(bbox[1] * inv),
                      int(bbox[2] * inv), int(bbox[3] * inv)]
            crop = frame[scaled[1]:scaled[3], scaled[0]:scaled[2]]
            face_img = cv2.resize(crop, (160, 160)) if crop.size > 0 else None
            if face_img is not None:
                return face_img, scaled, crop

        scale2 = 720 / max(h, w)
        if scale2 < 1.0:
            small2 = cv2.resize(frame, (int(w * scale2), int(h * scale2)))
            result2 = self._detect_faces_haar(small2)
            if result2[0] is not None:
                bbox = result2[1]
                inv2 = 1.0 / scale2
                scaled = [int(bbox[0] * inv2), int(bbox[1] * inv2),
                          int(bbox[2] * inv2), int(bbox[3] * inv2)]
                crop = frame[scaled[1]:scaled[3], scaled[0]:scaled[2]]
                face_img = cv2.resize(crop, (160, 160)) if crop.size > 0 else None
                if face_img is not None:
                    return face_img, scaled, crop

        result3 = self._detect_faces_haar(frame)
        if result3[0] is not None:
            bbox = result3[1]
            crop = frame[bbox[1]:bbox[3], bbox[0]:bbox[2]]
            return result3[0], bbox, crop
        return None, None, None

    def check_quality(self, face_img: np.ndarray, bbox: Optional[list] = None) -> Tuple[bool, Dict[str, Any]]:
        quality = {}
        if bbox is not None:
            fw = bbox[2] - bbox[0]
            fh = bbox[3] - bbox[1]
            quality["face_width"] = fw
            quality["face_height"] = fh
            if fw < 60:
                _quality_filter_stats["skipped_small"] += 1
                return False, {**quality, "reason": "LOW_QUALITY_FACE", "detail": f"face width {fw}px < 60px"}

        blur = _compute_blur_score(face_img)
        quality["blur_score"] = blur
        if blur < 15.0:
            _quality_filter_stats["skipped_blurry"] += 1
            return False, {**quality, "reason": "LOW_QUALITY_FACE", "detail": f"blur {blur:.1f} < 15.0"}

        bright = _compute_brightness(face_img)
        quality["brightness"] = bright
        if bright < 30 or bright > 240:
            _quality_filter_stats["skipped_dark"] += 1
            return False, {**quality, "reason": "LOW_QUALITY_FACE", "detail": f"brightness {bright:.1f}"}

        _quality_filter_stats["passed"] += 1
        quality["reason"] = "PASS"
        return True, quality

    def get_embedding(self, face_img: np.ndarray) -> Optional[np.ndarray]:
        """Generate embedding using DeepFace Facenet512 ONLY.
        No fallback — if DeepFace fails, the system operates in degraded mode."""
        backend = self.backend
        if backend is None:
            print("[FaceAdapter] DeepFace not available — cannot generate embedding")
            _set_runtime_engine("none")
            return None
        try:
            _quiet_stderr()
            try:
                embedding = backend.represent(
                    img_path=face_img,
                    model_name='Facenet512',
                    detector_backend='skip',
                    enforce_detection=False,
                    normalization='base',
                )
            finally:
                _restore_stderr()
            if embedding and len(embedding) > 0:
                emb = np.array(embedding[0]["embedding"])
                _set_runtime_engine("deepface")
                return self.l2_normalizer.transform([emb])[0]
            else:
                print("[FaceAdapter] DeepFace represent returned empty result")
                _set_runtime_engine("none")
                return None
        except Exception as e:
            print(f"[FaceAdapter] DeepFace represent FAILED: {e}")
            _set_runtime_engine("none")
            return None

    def compare_faces(self, embedding: np.ndarray, known_embeddings: List[Tuple[int, str, np.ndarray]],
                      threshold: Optional[float] = None) -> Tuple[Optional[int], Optional[str], float, float, List[Dict]]:
        if embedding is None or not known_embeddings:
            return None, None, 0.0, 0.0, []

        threshold = threshold or settings.FACE_MATCH_THRESHOLD
        best_score = 0.0
        second_best = 0.0
        best_match = None
        all_scores = []

        for worker_id, worker_name, known_emb in known_embeddings:
            if known_emb is None:
                continue
            try:
                if known_emb.shape != embedding.shape:
                    known_emb = known_emb.flatten()
                    embedding = embedding.flatten()
                dist = np.linalg.norm(embedding - known_emb)
                similarity = float(1.0 / (1.0 + dist))
                all_scores.append({"worker_id": worker_id, "worker_name": worker_name, "similarity": similarity})
                if similarity > best_score:
                    second_best = best_score
                    best_score = similarity
                    best_match = (worker_id, worker_name)
                elif similarity > second_best:
                    second_best = similarity
            except Exception:
                continue

        gap = best_score - second_best
        gap_threshold = settings.FACE_MATCH_MIN_GAP
        if best_match and best_score >= threshold and gap >= gap_threshold:
            return best_match[0], best_match[1], best_score, gap, all_scores
        best_name = best_match[1] if best_match else None
        return None, best_name, best_score, gap, all_scores

    def identify_worker(self, frame: np.ndarray, camera_id: int,
                        known_embeddings: List[Tuple[int, str, np.ndarray]]) -> Dict[str, Any]:
        timestamp = datetime.utcnow().isoformat()
        frame_h, frame_w = frame.shape[:2]
        face_img_resized, bbox, frame_crop = self.extract_face(frame)

        if face_img_resized is None:
            record_quality_attempt({
                "timestamp": timestamp, "camera_id": camera_id,
                "face_width": 0, "face_height": 0, "blur_score": 0, "brightness": 0,
                "face_area_percent": 0, "similarity": 0.0, "assigned_worker": None,
                "worker_id": None, "decision": "NO_FACE", "gap": 0.0,
            })
            return {"worker_id": None, "worker_name": None, "confidence": 0.0,
                    "bbox": None, "decision": "NO_FACE", "quality": {}, "timestamp": timestamp}

        passed, quality = self.check_quality(face_img_resized, bbox)
        if not passed:
            result = {"worker_id": None, "worker_name": None, "confidence": 0.0,
                      "bbox": bbox, "decision": quality.get("reason", "LOW_QUALITY_FACE"),
                      "quality": quality, "timestamp": timestamp}
            _save_debug_images(timestamp, camera_id, frame_crop, face_img_resized, face_img_resized, result)
            fw = quality.get("face_width", 0)
            fh = quality.get("face_height", 0)
            record_quality_attempt({
                "timestamp": timestamp, "camera_id": camera_id,
                "face_width": fw, "face_height": fh,
                "blur_score": quality.get("blur_score", 0),
                "brightness": quality.get("brightness", 0),
                "face_area_percent": round((fw * fh) / (frame_w * frame_h) * 100, 2) if fw and fh else 0,
                "similarity": 0.0, "assigned_worker": None,
                "worker_id": None, "decision": quality.get("reason", "LOW_QUALITY_FACE"),
                "gap": 0.0,
            })
            return result

        enhanced = _enhance_face(face_img_resized)

        embedding = self.get_embedding(enhanced)
        if embedding is None:
            result = {"worker_id": None, "worker_name": None, "confidence": 0.0,
                      "bbox": bbox, "decision": "EMBEDDING_FAILED",
                      "quality": quality, "timestamp": timestamp}
            _save_debug_images(timestamp, camera_id, frame_crop, face_img_resized, enhanced, result)
            fw = quality.get("face_width", 0)
            fh = quality.get("face_height", 0)
            record_quality_attempt({
                "timestamp": timestamp, "camera_id": camera_id,
                "face_width": fw, "face_height": fh,
                "blur_score": quality.get("blur_score", 0),
                "brightness": quality.get("brightness", 0),
                "face_area_percent": round((fw * fh) / (frame_w * frame_h) * 100, 2) if fw and fh else 0,
                "similarity": 0.0, "assigned_worker": None,
                "worker_id": None, "decision": "EMBEDDING_FAILED", "gap": 0.0,
            })
            return result

        worker_id, best_worker_name, confidence, gap, all_scores = self.compare_faces(embedding, known_embeddings)

        threshold = settings.FACE_MATCH_THRESHOLD
        gap_threshold = settings.FACE_MATCH_MIN_GAP
        second_best = max(0.0, confidence - gap)

        if worker_id is not None:
            decision = "MATCH"
            worker_name = best_worker_name
            print(f"[Face] cam={camera_id} best={best_worker_name} score={confidence:.3f} second={second_best:.3f} gap={gap:.3f} threshold={threshold} gap_threshold={gap_threshold} decision=MATCH")
        elif confidence >= threshold and gap < gap_threshold:
            decision = "REJECT_GAP"
            worker_name = best_worker_name
            print(f"[Face] cam={camera_id} best={best_worker_name} score={confidence:.3f} second={second_best:.3f} gap={gap:.3f} threshold={threshold} gap_threshold={gap_threshold} decision=REJECT_GAP")
        elif confidence > 0:
            decision = "REJECT_THRESHOLD"
            worker_name = best_worker_name
            print(f"[Face] cam={camera_id} best={best_worker_name} score={confidence:.3f} second={second_best:.3f} gap={gap:.3f} threshold={threshold} gap_threshold={gap_threshold} decision=REJECT_THRESHOLD")
        else:
            decision = "NO_MATCH"
            worker_name = None
            print(f"[Face] cam={camera_id} decision=NO_MATCH")

        result = {
            "worker_id": worker_id,
            "worker_name": worker_name,
            "confidence": confidence,
            "gap": gap,
            "bbox": bbox,
            "decision": decision,
            "quality": quality,
            "all_scores": all_scores,
            "timestamp": timestamp,
        }
        _save_debug_images(timestamp, camera_id, frame_crop, face_img_resized, enhanced, result)

        fw = quality.get("face_width", 0)
        fh = quality.get("face_height", 0)
        record_quality_attempt({
            "timestamp": timestamp, "camera_id": camera_id,
            "face_width": fw, "face_height": fh,
            "blur_score": quality.get("blur_score", 0),
            "brightness": quality.get("brightness", 0),
            "face_area_percent": round((fw * fh) / (frame_w * frame_h) * 100, 2) if fw and fh else 0,
            "similarity": confidence,
            "assigned_worker": worker_name,
            "worker_id": worker_id,
            "decision": decision,
            "gap": gap,
        })
        return result
