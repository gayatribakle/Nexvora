FROM python:3.11-slim

# System dependencies for OpenCV and WeasyPrint
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libwebkit2gtk-4.0-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/uploads/workers /app/uploads/evidence /app/uploads/reports /app/logs /app/data

# Expose port
EXPOSE 8000

# Default command (can be overridden for Celery worker)
CMD ["python", "run.py"]
