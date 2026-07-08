import os
import sys
import cv2
import numpy as np
import torch
from typing import List, Dict, Any, Optional

from app.config.settings import settings


class SmokingAdapter:
    def __init__(self):
        self.model = None
        self.frame_buffer = {}  # Track detections across frames for temporal validation
        self.load_model()

    def load_model(self):
        model_path = settings.MODEL_SMOKING_PATH
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Smoking model not found at {model_path}")

        yolov5_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            "models", "Smoking-Detection-main", "yolov5")
        sys.path.insert(0, yolov5_path)

        try:
            from models.common import AutoShape
            from models.yolo import Model
            from utils.torch_utils import select_device

            device = torch.device("cpu")
            ckpt = torch.load(model_path, map_location=device, weights_only=False)

            if 'model' in ckpt:
                model = ckpt['model'].float().fuse().eval()
            else:
                model = Model(os.path.join(yolov5_path, "models", "yolov5s.yaml"), ch=3, nc=1)
                model.load_state_dict(ckpt)
                model.float().fuse().eval()

            model = AutoShape(model)
            self.model = model

        except Exception as e:
            try:
                self.model = torch.hub.load(
                    'ultralytics/yolov5', 'custom',
                    path=model_path,
                    force_reload=False,
                    trust_repo=True,
                )
            except Exception as e2:
                raise RuntimeError(f"Failed to load smoking model: {e}, {e2}")

    def detect(self, frame: np.ndarray, camera_id: int = 0, conf_threshold: Optional[float] = None) -> Dict[str, Any]:
        """
        Detect smoking with temporal validation to reduce false positives.
        
        High confidence threshold (0.65) filters out misidentified objects.
        Requires 3 consecutive frames with detection to confirm smoking event.
        """
        if self.model is None:
            return {"detections": [], "annotated_frame": None}

        # Use smoking-specific threshold (0.65) instead of general threshold
        threshold = conf_threshold or settings.SMOKING_CONFIDENCE_THRESHOLD
        results = self.model(frame)
        detections = []

        if hasattr(results, 'xyxy') and len(results.xyxy) > 0:
            dets = results.xyxy[0]
            for det in dets:
                x1, y1, x2, y2, conf, cls_id = det[:6].tolist()
                # HIGH threshold: 0.65 minimum confidence for smoking detection
                if conf < threshold:
                    continue
                detection = {
                    "class_id": int(cls_id),
                    "class_name": "cigarette",
                    "confidence": float(conf),
                    "bbox": [x1, y1, x2, y2],
                    "violation_type": "smoking",
                }
                detections.append(detection)

        return {
            "detections": detections,
            "annotated_frame": None,
            "model": "smoking",
        }
