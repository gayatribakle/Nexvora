import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.database.session import SessionLocal
from app.database.models import SystemLog

logger = logging.getLogger(__name__)


class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time

        if request.url.path.startswith("/api/"):
            try:
                db = SessionLocal()
                user_id = None
                if hasattr(request.state, "user") and request.state.user:
                    user_id = request.state.user.get("id")
                log = SystemLog(
                    action=f"{request.method} {request.url.path}",
                    details=f"Status: {response.status_code}, Time: {process_time:.3f}s",
                    user_id=user_id,
                    ip_address=request.client.host if request.client else None,
                )
                db.add(log)
                db.commit()
                db.close()
            except Exception as e:
                logger.error(f"Audit log error: {e}")

        response.headers["X-Process-Time"] = str(process_time)
        return response
