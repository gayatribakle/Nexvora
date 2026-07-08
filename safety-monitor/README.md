# Construction Site Safety Monitoring System

Enterprise-grade AI-powered surveillance system for construction site safety monitoring.

## Architecture

```
safety-monitor/
  backend/          - FastAPI Python backend
  frontend/         - React TypeScript frontend
  models/           - Pre-trained AI models (YOLOv8, YOLOv5, DeepFace)
  videos/           - Demo CCTV video files (cam1-4.mp4)
```

## Quick Start

### Prerequisites
- Python 3.10+ (with pip)
- Node.js 18+
- npm (comes with Node.js)
- Git (to clone model repos if needed)

### One-Click Setup

Double-click **`setup.bat`** — it installs everything automatically:
- Python backend packages (FastAPI, PyTorch, TensorFlow, OpenCV, etc.)
- React frontend packages (Vite, Chart.js, etc.)
- Required directories (data, uploads, logs)

> **Note**: First run takes 10-30 minutes (TensorFlow + PyTorch are large).

### Run

Double-click **`start.bat`** to launch both servers, or manually:

```bash
cd backend && python run.py     # API at http://localhost:8000
cd frontend && npm run dev      # UI at http://localhost:3000
```

### AI Models

Place trained YOLO weights and DeepFace in the `models/` folder:

| Model | Path |
|-------|------|
| PPE Detection | `models/Construction-Site-Safety-PPE-Detection-main/models/best.pt` |
| Smoking Detection | `models/Smoking-Detection-main/yolov5/epochs_100/weights.pt` |
| Fire & Smoke | `models/YOLOv8-Fire-and-Smoke-Detection-main/runs/detect/train/weights/best.pt` |
| Face Recognition | `models/deepface-master/` (full DeepFace package) |

### Demo Videos

Place 4 MP4 files in the `videos/` folder: `cam1.mp4` through `cam4.mp4`.

## Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Login Credentials
- Admin: `admin` / `admin123`
- Worker: `worker` / `worker123`
- Supervisor: `supervisor` / `super123`

## AI Models

### PPE Detection (YOLOv8n)
- Detects: Hardhat, Mask, NO-Hardhat, NO-Mask, NO-Safety Vest, Safety Vest
- Weights: `models/Construction-Site-Safety-PPE-Detection-main/models/best.pt`
- 10 classes, 640x640 input

### Smoking Detection (YOLOv5s)
- Detects: Cigarette smoking
- Weights: `models/Smoking-Detection-main/yolov5/epochs_100/weights.pt`
- 1 class, 512x512 input

### Fire Detection (YOLOv8s)
- Detects: Fire, Smoke
- Weights: `models/YOLOv8-Fire-and-Smoke-Detection-main/runs/detect/train/weights/best.pt`
- 3 classes, 608x608 input

### Face Recognition (DeepFace)
- Model: Facenet512
- Used for worker identification

## Features

- Real-time CCTV monitoring with 4 simultaneous feeds
- AI-powered PPE, smoking, and fire detection
- Worker face identification
- Violation detection and review workflow
- Fine management system
- Safety score tracking and leaderboard
- Government scheme management
- Emergency broadcast system
- Training and quiz modules
- Reports and analytics
- Real-time WebSocket alerts
- JWT authentication with role-based access
