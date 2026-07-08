@echo off
title Safety Monitor - Setup
color 0B
setlocal enabledelayedexpansion

echo ============================================
echo  Safety Monitor - One-Click Setup
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Python not found. Install Python 3.10+ from https://python.org
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set pyver=%%i
echo [OK] Python %pyver% found

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Node.js not found. Install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
for /f %%i in ('node --version') do set nodever=%%i
echo [OK] Node.js %nodever% found
echo.

:: Set project root
set ROOT=%~dp0
cd /d "%ROOT%"

:: ============================================
:: Step 1: Create directories
:: ============================================
echo [1/5] Creating required directories...
if not exist "backend\data" mkdir backend\data
if not exist "backend\uploads\workers" mkdir backend\uploads\workers
if not exist "backend\uploads\evidence" mkdir backend\uploads\evidence
if not exist "backend\uploads\reports" mkdir backend\uploads\reports
if not exist "backend\logs" mkdir backend\logs
if not exist "models" mkdir models
if not exist "videos" mkdir videos
echo [OK] Directories created
echo.

:: ============================================
:: Step 2: Backend dependencies
:: ============================================
echo [2/5] Installing Python backend dependencies...
echo  (This may take 10-30 minutes on first run)
echo  (TensorFlow + PyTorch are large downloads)
echo.
cd /d "%ROOT%\backend"
pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [FAIL] Backend pip install failed. Check errors above.
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

:: ============================================
:: Step 3: Frontend dependencies
:: ============================================
echo [3/5] Installing React frontend dependencies...
cd /d "%ROOT%\frontend"
call npm install
if %errorlevel% neq 0 (
    echo [FAIL] Frontend npm install failed.
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

:: ============================================
:: Step 4: Model files check
:: ============================================
echo [4/5] Checking AI model files...
echo.
set MODELS_MISSING=0

if not exist "%ROOT%\models\Construction-Site-Safety-PPE-Detection-main\models\best.pt" (
    echo [WARN] PPE model not found at models/Construction-Site-Safety-PPE-Detection-main/models/best.pt
    set /a MODELS_MISSING+=1
)
if not exist "%ROOT%\models\Smoking-Detection-main\yolov5\epochs_100\weights.pt" (
    echo [WARN] Smoking model not found at models/Smoking-Detection-main/yolov5/epochs_100/weights.pt
    set /a MODELS_MISSING+=1
)
if not exist "%ROOT%\models\YOLOv8-Fire-and-Smoke-Detection-main\runs\detect\train\weights\best.pt" (
    echo [WARN] Fire model not found at models/YOLOv8-Fire-and-Smoke-Detection-main/runs/detect/train/weights/best.pt
    set /a MODELS_MISSING+=1
)
if not exist "%ROOT%\models\deepface-master\deepface\DeepFace.py" (
    echo [WARN] DeepFace not found at models/deepface-master/
    set /a MODELS_MISSING+=1
)

if !MODELS_MISSING! gtr 0 (
    echo.
    echo [!] %MODELS_MISSING% model(s) missing.
    echo     Place trained models in the "models" folder before running detection.
    echo     See README.md for model paths and download instructions.
) else (
    echo [OK] All AI models found
)
echo.

:: ============================================
:: Step 5: Video files check
:: ============================================
echo [5/5] Checking demo video files...
set VIDEOS_MISSING=0
for /l %%i in (1,1,4) do (
    if not exist "%ROOT%\videos\cam%%i.mp4" (
        echo [WARN] cam%%i.mp4 not found in videos/
        set /a VIDEOS_MISSING+=1
    )
)
if !VIDEOS_MISSING! gtr 0 (
    echo [!] %VIDEOS_MISSING% video(s) missing.
    echo     Place cam1.mp4 - cam4.mp4 in the "videos" folder.
) else (
    echo [OK] All demo videos found
)
echo.

:: ============================================
:: Done
:: ============================================
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo  Run the system:
echo    Double-click  start.bat
echo.
echo  Or manually:
echo    cd backend ^&^& python run.py     (API on :8000)
echo    cd frontend ^&^& npm run dev      (UI on :3000)
echo.
echo  Login: admin / admin123
echo.
echo  Press any key to exit...
pause >nul
