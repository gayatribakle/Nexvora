import os
import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from ultralytics import YOLO

from app.config.settings import settings


class PPEAdapter:
    def __init__(self):
        self.model = None
        self.class_names = [
            "Hardhat", "Mask", "NO-Hardhat", "NO-Mask",
            "NO-Safety Vest", "Person", "Safety Cone",
            "Safety Vest", "machinery", "vehicle"
        ]
        self.violation_classes = {
            "NO-Hardhat": "no_hardhat",
            "NO-Mask": "no_mask",
            "NO-Safety Vest": "no_safety_vest",
        }
        self.load_model()

    def load_model(self):
        model_path = settings.MODEL_PPE_PATH
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"PPE model not found at {model_path}")
        self.model = YOLO(model_path)

    def detect(self, frame: np.ndarray, conf_threshold: Optional[float] = None) -> Dict[str, Any]:
        if self.model is None:
            return {"detections": [], "annotated_frame": None}

        threshold = conf_threshold or settings.CONFIDENCE_THRESHOLD
        results = self.model(frame, verbose=False, conf=threshold)
        detections = []

        for result in results:
            if result.boxes is None:
                continue
            boxes = result.boxes.xyxy.cpu().numpy()
            confs = result.boxes.conf.cpu().numpy()
            cls_ids = result.boxes.cls.cpu().numpy().astype(int)

            for i in range(len(boxes)):
                class_name = self.class_names[cls_ids[i]] if cls_ids[i] < len(self.class_names) else "unknown"
                detection = {
                    "class_id": int(cls_ids[i]),
                    "class_name": class_name,
                    "confidence": float(confs[i]),
                    "bbox": boxes[i].tolist(),
                    "violation_type": self.violation_classes.get(class_name, None),
                }
                detections.append(detection)

        return {
            "detections": detections,
            "annotated_frame": None,
            "model": "ppe",
        }
