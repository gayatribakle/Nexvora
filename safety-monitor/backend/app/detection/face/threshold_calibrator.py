"""Threshold calibration from genuine vs incorrect match similarity data."""
import json
import os
import glob
from typing import Dict, List, Optional
import numpy as np


_CALIBRATION_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "data", "threshold_calibration.json"
)


def record_match(worker_id: int, similarity: float, is_genuine: bool):
    data = _load_data()
    key = "genuine" if is_genuine else "incorrect"
    data.setdefault(key, []).append({"worker_id": worker_id, "similarity": round(similarity, 4)})
    _save_data(data)


def _load_data() -> Dict:
    if os.path.exists(_CALIBRATION_FILE):
        try:
            with open(_CALIBRATION_FILE) as f:
                return json.load(f)
        except Exception:
            return {"genuine": [], "incorrect": []}
    return {"genuine": [], "incorrect": []}


def _save_data(data: Dict):
    os.makedirs(os.path.dirname(_CALIBRATION_FILE), exist_ok=True)
    with open(_CALIBRATION_FILE, "w") as f:
        json.dump(data, f, indent=2)


def compute_stats() -> Dict:
    data = _load_data()
    result = {}
    for key in ["genuine", "incorrect"]:
        scores = [item["similarity"] for item in data.get(key, [])]
        if scores:
            arr = np.array(scores)
            result[key] = {
                "count": len(scores),
                "min": round(float(arr.min()), 4),
                "max": round(float(arr.max()), 4),
                "avg": round(float(arr.mean()), 4),
                "median": round(float(np.median(arr)), 4),
                "std": round(float(arr.std()), 4),
            }
        else:
            result[key] = {"count": 0, "min": 0, "max": 0, "avg": 0, "median": 0, "std": 0}
    result["recommended_threshold"] = _recommend_threshold(result)
    return result


def _recommend_threshold(stats: Dict) -> float:
    g = stats.get("genuine", {})
    i = stats.get("incorrect", {})
    if g.get("count", 0) == 0:
        return 0.40
    if i.get("count", 0) == 0:
        return round(g["min"] * 0.95, 3)
    low_genuine = g["min"]
    high_incorrect = i["max"]
    if high_incorrect >= low_genuine:
        mid = (low_genuine + high_incorrect) / 2
    else:
        mid = (low_genuine + high_incorrect) / 2
    return round(mid, 3)


def reset_data():
    _save_data({"genuine": [], "incorrect": []})
