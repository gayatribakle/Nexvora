import uvicorn
import os
import sys

# Add parent directory to path so app module can be found
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config.settings import settings

if __name__ == "__main__":
    ssl_kwargs = {}
    if settings.SSL_CERTFILE and settings.SSL_KEYFILE:
        ssl_kwargs = {
            "ssl_certfile": settings.SSL_CERTFILE,
            "ssl_keyfile": settings.SSL_KEYFILE,
        }
        print(f"Starting with HTTPS: cert={settings.SSL_CERTFILE}")
    else:
        print("Starting with HTTP (no SSL certificates configured)")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
        **ssl_kwargs,
    )
