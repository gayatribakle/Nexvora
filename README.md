# Nexvora - Construction Safety Monitoring System

Nexvora is a comprehensive AI-powered safety monitoring system designed for construction sites. It utilizes real-time computer vision to detect safety violations, ensure worker compliance, and maintain a secure working environment.

## Key Features

- **Personal Protective Equipment (PPE) Detection**: Automatically detects if workers are wearing hard hats, safety vests, and other required gear.
- **Facial Recognition**: Identifies workers on-site for attendance, authorization, and tracking violations against specific profiles.
- **Hazard Detection**: Monitors the site for smoking and fire outbreaks to prevent accidents.
- **Worker Dashboard & Analytics**: A detailed frontend for administrators to review incidents, manage worker profiles, calibrate detection thresholds, and track overall safety compliance.
- **Real-Time Alerts**: Generates immediate notifications for detected violations and critical events.
- **Penalty Management**: Automated fine calculation based on recorded safety violations.

## Technology Stack

### Backend
- **Python (FastAPI)**: High-performance API server.
- **Computer Vision (YOLO)**: Object detection and image processing.
- **Celery & Redis**: Background task processing for video and image analysis.
- **PostgreSQL**: Relational database for storing worker profiles, violations, and system configurations.
- **MinIO**: Object storage for violation snapshots and video footage.
- **WebSocket**: Real-time communication for live notifications.

### Frontend
- **React (Vite)**: Fast and modern user interface.
- **TypeScript**: Strictly typed JavaScript for reliable code.
- **Tailwind CSS**: Utility-first styling for a responsive and modern aesthetic.

## Project Structure

- `safety-monitor/backend/`: Contains the FastAPI application, background tasks, and AI detection modules.
- `safety-monitor/frontend/`: Contains the React-based web dashboard and user interface.