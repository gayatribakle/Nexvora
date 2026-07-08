import io
import os
import logging
from typing import Optional
from datetime import timedelta

from app.config.settings import settings

logger = logging.getLogger(__name__)

_minio_client = None


def get_minio_client():
    """Get or create MinIO client singleton."""
    global _minio_client
    if _minio_client is not None:
        return _minio_client

    try:
        from minio import Minio
        _minio_client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        return _minio_client
    except Exception as e:
        logger.error(f"MinIO client creation failed: {e}")
        return None


def ensure_bucket(bucket_name: Optional[str] = None):
    """Create the bucket if it doesn't exist."""
    client = get_minio_client()
    if client is None:
        logger.warning("MinIO client not available, skipping bucket creation")
        return False

    bucket = bucket_name or settings.MINIO_BUCKET
    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
            logger.info(f"Created MinIO bucket: {bucket}")
        return True
    except Exception as e:
        logger.error(f"MinIO bucket creation failed: {e}")
        return False


def upload_file(
    file_path: str,
    object_name: Optional[str] = None,
    bucket_name: Optional[str] = None,
    content_type: Optional[str] = None,
) -> Optional[str]:
    """Upload a file to MinIO and return the object key."""
    client = get_minio_client()
    if client is None:
        logger.warning("MinIO client not available, skipping upload")
        return None

    bucket = bucket_name or settings.MINIO_BUCKET

    if object_name is None:
        object_name = os.path.basename(file_path)

    if content_type is None:
        ext = os.path.splitext(file_name := os.path.basename(file_path))[1].lower()
        content_type_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".mp4": "video/mp4",
            ".avi": "video/x-msvideo",
            ".mov": "video/quicktime",
            ".mkv": "video/x-matroska",
            ".pdf": "application/pdf",
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
        content_type = content_type_map.get(ext, "application/octet-stream")

    try:
        file_size = os.path.getsize(file_path)
        client.fput_object(
            bucket_name=bucket,
            object_name=object_name,
            file_path=file_path,
            content_type=content_type,
        )
        logger.info(f"Uploaded {object_name} to MinIO bucket {bucket}")
        return object_name
    except Exception as e:
        logger.error(f"MinIO upload failed: {e}")
        return None


def upload_bytes(
    data: bytes,
    object_name: str,
    bucket_name: Optional[str] = None,
    content_type: str = "application/octet-stream",
) -> Optional[str]:
    """Upload bytes data to MinIO and return the object key."""
    client = get_minio_client()
    if client is None:
        return None

    bucket = bucket_name or settings.MINIO_BUCKET

    try:
        client.put_object(
            bucket_name=bucket,
            object_name=object_name,
            data=io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        logger.info(f"Uploaded {object_name} ({len(data)} bytes) to MinIO bucket {bucket}")
        return object_name
    except Exception as e:
        logger.error(f"MinIO bytes upload failed: {e}")
        return None


def download_file(
    object_name: str,
    file_path: str,
    bucket_name: Optional[str] = None,
) -> bool:
    """Download a file from MinIO."""
    client = get_minio_client()
    if client is None:
        return False

    bucket = bucket_name or settings.MINIO_BUCKET

    try:
        client.fget_object(bucket_name=bucket, object_name=object_name, file_path=file_path)
        return True
    except Exception as e:
        logger.error(f"MinIO download failed: {e}")
        return False


def get_presigned_url(
    object_name: str,
    bucket_name: Optional[str] = None,
    expires: timedelta = timedelta(hours=1),
) -> Optional[str]:
    """Generate a presigned URL for temporary access to an object."""
    client = get_minio_client()
    if client is None:
        return None

    bucket = bucket_name or settings.MINIO_BUCKET

    try:
        url = client.presigned_get_object(bucket_name=bucket, object_name=object_name, expires=expires)
        return url
    except Exception as e:
        logger.error(f"MinIO presigned URL failed: {e}")
        return None


def delete_object(
    object_name: str,
    bucket_name: Optional[str] = None,
) -> bool:
    """Delete an object from MinIO."""
    client = get_minio_client()
    if client is None:
        return False

    bucket = bucket_name or settings.MINIO_BUCKET

    try:
        client.remove_object(bucket_name=bucket, object_name=object_name)
        return True
    except Exception as e:
        logger.error(f"MinIO delete failed: {e}")
        return False


def upload_evidence(
    data: bytes,
    evidence_type: str,
    filename: str,
    content_type: str = "image/jpeg",
) -> Optional[str]:
    """Upload evidence file to MinIO under the evidence/ prefix."""
    object_name = f"evidence/{evidence_type}/{filename}"
    return upload_bytes(data, object_name, content_type=content_type)
