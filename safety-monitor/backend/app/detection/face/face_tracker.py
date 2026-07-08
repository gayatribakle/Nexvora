"""Per-camera face tracking with weighted temporal voting.

Vote weights by confidence level:
  High     >= 0.50  → weight=3  (Confirmed)
  Probable 0.40-0.49 → weight=1  (Weak match)
  Unknown  < 0.40   → weight=0  (No vote)

Confirmation requires total_weight >= min_weight (default=4).
This prevents a noisy/overly-broad embedding (e.g. Tulsidas) from
dominating by requiring 4 probable votes vs only 2 high-confidence votes.
"""
from collections import defaultdict
from typing import Dict, List, Optional, Tuple


def _confidence_weight(confidence: float) -> int:
    if confidence >= 0.50:
        return 3
    elif confidence >= 0.40:
        return 1
    return 0


def _confidence_label(confidence: float) -> str:
    if confidence >= 0.50:
        return "HIGH"
    elif confidence >= 0.40:
        return "PROBABLE"
    return "LOW"


class FaceTracker:
    """Tracks face identity across frames with weighted temporal voting.

    High-confidence matches (>=0.50) accumulate weight faster (3x) than
    probable matches (1x). Unknown matches (<0.40) contribute zero weight.

    Target confirmation: 2 high votes (6 weight) or 4 probable votes (4 weight).
    """

    def __init__(self, history_size: int = 15, min_weight: int = 4):
        self.history_size = history_size
        self.min_weight = min_weight
        self._votes: Dict[int, List[Tuple[Optional[int], Optional[str], float, str, int]]] = defaultdict(list)

    def record_vote(self, camera_id: int, worker_id: Optional[int],
                    worker_name: Optional[str], confidence: float, decision: str = ""):
        weight = _confidence_weight(confidence) if worker_id is not None else 0
        history = self._votes[camera_id]
        history.append((worker_id, worker_name, confidence, decision, weight))
        if len(history) > self.history_size:
            history.pop(0)

    def get_confirmed(self, camera_id: int) -> Tuple[Optional[int], Optional[str], float, str]:
        history = self._votes.get(camera_id, [])
        weighted: Dict[int, int] = {}
        sims: Dict[int, List[float]] = {}
        names: Dict[int, str] = {}

        for wid, wname, conf, dec, weight in history:
            if wid is not None and weight > 0:
                weighted[wid] = weighted.get(wid, 0) + weight
                sims.setdefault(wid, []).append(conf)
                if wname:
                    names[wid] = wname

        if not weighted:
            return None, None, 0.0, "WAITING"

        best_id = max(weighted, key=weighted.get)
        best_weight = weighted[best_id]
        total_weight = sum(weighted.values())

        if best_weight >= self.min_weight and best_weight >= total_weight * 0.5:
            avg_conf = sum(sims[best_id]) / len(sims[best_id]) if sims[best_id] else 0.0
            return best_id, names.get(best_id), avg_conf, "CONFIRMED"

        return None, None, 0.0, "NO_CONSENSUS"

    def get_consensus(self, camera_id: int) -> Optional[Dict]:
        """Get the current consensus worker for a camera, even if not yet confirmed."""
        history = self._votes.get(camera_id, [])
        weighted: Dict[int, int] = {}
        sims: Dict[int, List[float]] = {}
        names: Dict[int, str] = {}

        for wid, wname, conf, dec, weight in history:
            if wid is not None and weight > 0:
                weighted[wid] = weighted.get(wid, 0) + weight
                sims.setdefault(wid, []).append(conf)
                if wname:
                    names[wid] = wname

        if not weighted:
            return None

        best_id = max(weighted, key=weighted.get)
        best_weight = weighted[best_id]
        avg_conf = sum(sims[best_id]) / len(sims[best_id]) if sims[best_id] else 0.0

        return {
            "worker_id": best_id,
            "worker_name": names.get(best_id),
            "weight": best_weight,
            "avg_confidence": avg_conf,
        }

    def reset_camera(self, camera_id: int):
        self._votes[camera_id].clear()

    def get_vote_history(self, camera_id: int) -> List[Dict]:
        return [
            {
                "worker_id": wid, "worker_name": wname,
                "confidence": conf, "decision": dec,
                "weight": weight,
                "label": _confidence_label(conf) if wid is not None else "NONE",
            }
            for wid, wname, conf, dec, weight in self._votes.get(camera_id, [])
        ]
