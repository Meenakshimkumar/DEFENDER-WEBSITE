@echo off
echo =======================================
echo DEFENDER - Starting Backend Server
echo =======================================
echo Activating Virtual Environment...
call venv\Scripts\activate.bat

echo Starting Flask Server...
python app.py
