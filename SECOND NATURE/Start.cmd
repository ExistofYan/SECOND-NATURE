@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python or use npm run dev from this folder.
  pause
  exit /b 1
)
echo One Day, Less Waste 1.3.1
echo Open http://127.0.0.1:5174/?v=1.3.1 and allow the camera in your browser.
echo Keep this window open while playing. Press Ctrl+C to stop the local server.
start "" "http://127.0.0.1:5174/?v=1.3.1"
python -m http.server 5174 --bind 127.0.0.1 --directory dist
