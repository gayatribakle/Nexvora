import cv2
import numpy as np
import threading
import time
from typing import Dict, Optional, Callable, List
from queue import Queue
from dataclasses import dataclass

PPE_TYPES = {"no_hardhat", "no_safety_vest", "no_mask", "ppe_violation"}
BOX_COLORS = {
    "ppe": (0, 0, 255),
    "smoking": (0, 140, 255),
    "fire": (255, 0, 0),
    "default": (0, 255, 0),
}


def draw_detections(frame: np.ndarray, detections: List[dict], worker_name: str = None):
    """Draw detection boxes and OSD on a frame in-place."""
    if not detections:
        return
    ppe = smoke = fire = 0
    for d in detections:
        vtype = d.get("violation_type")
        bbox = d.get("bbox")
        conf = d.get("confidence", 0)
        if not bbox:
            continue
        x1, y1, x2, y2 = [int(v) for v in bbox[:4]]
        if vtype in PPE_TYPES:
            color = BOX_COLORS["ppe"]; ppe += 1
        elif vtype == "smoking":
            color = BOX_COLORS["smoking"]; smoke += 1
        elif vtype == "fire":
            color = BOX_COLORS["fire"]; fire += 1
        else:
            color = BOX_COLORS["default"]
        label = vtype.replace("_", " ").title() if vtype else d.get("class_name", "object")
        label += f" {conf:.2f}"
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
        cv2.rectangle(frame, (x1, y1 - th - 8), (x1 + tw + 8, y1), color, -1)
        cv2.putText(frame, label, (x1 + 4, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
    x0, y0, lh = 12, 24, 22
    if ppe:
        cv2.putText(frame, f"PPE: {ppe}", (x0, y0), cv2.FONT_HERSHEY_SIMPLEX, 0.55, BOX_COLORS["ppe"], 2)
        y0 += lh
    if smoke:
        cv2.putText(frame, f"Smoking: {smoke}", (x0, y0), cv2.FONT_HERSHEY_SIMPLEX, 0.55, BOX_COLORS["smoking"], 2)
        y0 += lh
    if fire:
        cv2.putText(frame, f"Fire: {fire}", (x0, y0), cv2.FONT_HERSHEY_SIMPLEX, 0.55, BOX_COLORS["fire"], 2)
    if worker_name:
        h = frame.shape[0]
        cv2.putText(frame, f"Worker: {worker_name}", (12, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)


@dataclass
class StreamState:
    camera_id: int
    is_active: bool = False
    fps: float = 0.0
    frame_count: int = 0
    last_frame: Optional[np.ndarray] = None
    annotated_frame: Optional[np.ndarray] = None
    latest_detections: list = None
    frame_version: int = 0


class StreamManager:
    def __init__(self, max_cameras: int = 4):
        self.max_cameras = max_cameras
        self.streams: Dict[int, Dict] = {}
        self.states: Dict[int, StreamState] = {}
        self.frame_buffers: Dict[int, Queue] = {}
        self._lock = threading.Lock()
        self._running = False

    def start_camera(self, camera_id: int, video_path: str, detection_callback: Optional[Callable] = None):
        if camera_id in self.streams:
            state = self.states.get(camera_id)
            if state and state.is_active:
                return
            self.stop_camera(camera_id)

        frame_buffer = Queue(maxsize=5)
        state = StreamState(camera_id=camera_id)

        stream_thread = threading.Thread(
            target=self._stream_worker,
            args=(camera_id, video_path, frame_buffer, state, detection_callback),
            daemon=True,
            name=f"stream-{camera_id}",
        )

        detect_thread = threading.Thread(
            target=self._detect_worker,
            args=(camera_id, frame_buffer, state, detection_callback),
            daemon=True,
            name=f"detect-{camera_id}",
        )

        with self._lock:
            self.streams[camera_id] = {
                "thread": stream_thread,
                "detect_thread": detect_thread,
                "video_path": video_path,
            }
            self.frame_buffers[camera_id] = frame_buffer
            self.states[camera_id] = state

        state.is_active = True
        stream_thread.start()
        detect_thread.start()

    def stop_camera(self, camera_id: int):
        with self._lock:
            if camera_id in self.states:
                self.states[camera_id].is_active = False
            self.streams.pop(camera_id, None)
            self.frame_buffers.pop(camera_id, None)

    def stop_all(self):
        for cam_id in list(self.streams.keys()):
            self.stop_camera(cam_id)

    def _stream_worker(self, camera_id: int, video_path: str, buffer: Queue,
                       state: StreamState, detection_callback: Optional[Callable]):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            state.is_active = False
            return

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        frame_time = 1.0 / fps
        frame_skip = 0
        skip_frames = 3

        try:
            retry_count = 0
            while state.is_active:
                loop_start = time.time()

                ret, frame = cap.read()
                if not ret:
                    retry_count += 1
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    if retry_count > 30:
                        time.sleep(0.5)
                    continue
                retry_count = 0

                state.frame_count += 1
                state.last_frame = frame

                display = frame.copy()
                if state.latest_detections:
                    draw_detections(display, state.latest_detections)
                state.annotated_frame = display
                state.frame_version += 1

                frame_skip += 1
                if frame_skip >= skip_frames and detection_callback:
                    if buffer.full():
                        try:
                            buffer.get_nowait()
                        except Exception:
                            pass
                    try:
                        buffer.put_nowait(frame.copy())
                    except Exception:
                        pass
                    frame_skip = 0

                elapsed = time.time() - loop_start
                sleep_time = max(0, frame_time - elapsed)
                if sleep_time > 0:
                    time.sleep(sleep_time)
        except Exception as e:
            print(f"Stream worker error (cam {camera_id}): {e}")
        finally:
            cap.release()

    def _detect_worker(self, camera_id: int, buffer: Queue, state: StreamState,
                       detection_callback: Optional[Callable]):
        try:
            while state.is_active:
                try:
                    frame = buffer.get(timeout=1.0)
                except Exception:
                    continue

                if detection_callback and frame is not None:
                    try:
                        result = detection_callback(camera_id, frame)
                        if result:
                            state.latest_detections = result.get("detections", [])
                    except Exception as e:
                        print(f"Detection callback error (cam {camera_id}): {e}")
        except Exception as e:
            print(f"Detect worker crashed (cam {camera_id}): {e}")

    def get_frame(self, camera_id: int) -> Optional[np.ndarray]:
        with self._lock:
            if camera_id in self.states:
                af = self.states[camera_id].annotated_frame
                return af if af is not None else self.states[camera_id].last_frame
        return None

    def get_frame_version(self, camera_id: int) -> int:
        with self._lock:
            if camera_id in self.states:
                return self.states[camera_id].frame_version
        return -1

    def get_states(self) -> Dict[int, StreamState]:
        return self.states

    def get_active_count(self) -> int:
        return sum(1 for s in self.states.values() if s.is_active)
