@echo off
echo Starting Safety Monitor Backend...
echo.
echo Ensuring directories...
if not exist "data" mkdir data
if not exist "uploads\workers" mkdir uploads\workers
if not exist "uploads\evidence" mkdir uploads\evidence
if not exist "uploads\reports" mkdir uploads\reports
if not exist "logs" mkdir logs

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting server...
python run.py
pause
