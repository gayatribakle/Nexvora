import os
import json
import cv2
import logging
import numpy as np
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session

from app.database.models import Worker, WorkerImage, EmployeeEmbedding
from app.detection.face.face_adapter import FaceAdapter
from app.config.settings import settings

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "deepface_facenet512"
EMBEDDING_VERSION = 1


def _wrap_embedding(emb: np.ndarray) -> str:
    return json.dumps({
        "__model__": EMBEDDING_MODEL,
        "__version__": EMBEDDING_VERSION,
        "embedding": emb.tolist(),
    })


def _unwrap_embedding(data: str) -> Optional[np.ndarray]:
    try:
        obj = json.loads(data)
        if isinstance(obj, dict) and "embedding" in obj:
            emb = np.array(obj["embedding"], dtype=np.float32)
            if emb.ndim == 1 and emb.shape[0] > 0:
                return emb
        return None
    except Exception:
        return None


class FaceService:
    def __init__(self, face_adapter: FaceAdapter):
        self.face_adapter = face_adapter

    def load_known_embeddings(self, db: Session) -> List[Tuple[int, str, np.ndarray]]:
        embeddings = []
        workers = db.query(Worker).filter(Worker.is_active == True).all()
        if not workers:
            logger.info("[FaceService] No active workers in DB")
            return embeddings

        for worker in workers:
            primary_img = db.query(WorkerImage).filter(
                WorkerImage.worker_id == worker.id,
                WorkerImage.is_primary == True,
            ).first()

            if primary_img:
                emb = None
                if primary_img.embedding:
                    emb = _unwrap_embedding(primary_img.embedding)
                    if emb is None:
                        logger.info(f"  [FaceService] Stale/incompatible embedding for worker {worker.id}, will recompute")

                if emb is None and os.path.exists(primary_img.filepath):
                    try:
                        img = cv2.imread(primary_img.filepath)
                        if img is not None:
                            face_img, _, _ = self.face_adapter.extract_face(img)
                            if face_img is not None:
                                emb = self.face_adapter.get_embedding(face_img)
                                if emb is not None:
                                    primary_img.embedding = _wrap_embedding(emb)
                                    db.commit()
                                    logger.info(f"  [FaceService] Recomputed embedding for worker {worker.id} ({worker.user.full_name if worker.user else '?'})")
                                else:
                                    logger.warning(f"  [FaceService] get_embedding returned None for worker {worker.id}")
                            else:
                                logger.warning(f"  [FaceService] extract_face returned None for worker {worker.id}")
                    except Exception as e:
                        logger.error(f"  [FaceService] Recompute failed for worker {worker.id}: {e}", exc_info=True)
                elif emb is None:
                    logger.warning(f"  [FaceService] No image on disk to recompute for worker {worker.id}")

                if emb is not None:
                    worker_name = worker.user.full_name if worker.user else "Unknown"
                    embeddings.append((worker.id, worker_name, emb))
            else:
                logger.debug(f"  [FaceService] No primary image for worker {worker.id}")

        logger.info(f"[FaceService] Loaded {len(embeddings)} valid embeddings")
        return embeddings

    def register_worker_face(self, worker_id: int, image_path: str, db: Session, photo_type: str = "front_face") -> bool:
        try:
            img = cv2.imread(image_path)
            if img is None:
                return False

            face_img, _, _ = self.face_adapter.extract_face(img)
            if face_img is None:
                return False

            embedding = self.face_adapter.get_embedding(face_img)
            if embedding is None:
                return False

            wrapped = _wrap_embedding(embedding)

            # Find existing image record
            existing = db.query(WorkerImage).filter(
                WorkerImage.worker_id == worker_id,
                WorkerImage.filepath == image_path,
            ).first()

            if existing:
                existing.embedding = wrapped
                existing.photo_type = photo_type
            else:
                # Check for primary image
                is_primary = not db.query(WorkerImage).filter(
                    WorkerImage.worker_id == worker_id,
                    WorkerImage.is_primary == True,
                ).first()

                worker_img = WorkerImage(
                    worker_id=worker_id,
                    filename=os.path.basename(image_path),
                    filepath=image_path,
                    embedding=wrapped,
                    is_primary=is_primary,
                    photo_type=photo_type,
                )
                db.add(worker_img)

            # Also store in employee_embeddings table
            existing_emb = db.query(EmployeeEmbedding).filter(
                EmployeeEmbedding.worker_id == worker_id,
                EmployeeEmbedding.photo_type == photo_type,
            ).first()
            if existing_emb:
                existing_emb.embedding = wrapped
                existing_emb.embedding_dim = len(embedding)
            else:
                emb_record = EmployeeEmbedding(
                    worker_id=worker_id,
                    embedding=wrapped,
                    embedding_dim=len(embedding),
                    photo_type=photo_type,
                    model_name="Facenet512",
                )
                db.add(emb_record)

            db.commit()
            return True
        except Exception as e:
            logger.error(f"Face registration error: {e}", exc_info=True)
            return False
    