@echo off
setlocal
cd /d "%~dp0"

set PORT=8080
set URL=http://127.0.0.1:%PORT%/

echo.
echo  TheDDOS - local HTTP (no-cache)
echo  Folder: %CD%
echo  URL:    %URL%
echo  If stuck: Ctrl+Shift+R once, wait, check Console
echo  Close this window to stop the server.
echo.

set PY=
where py >nul 2>&1 && set PY=py
if not defined PY (
  where python >nul 2>&1 && set PY=python
)
if not defined PY (
  echo [ERROR] Python not found on PATH.
  echo Install Python 3, or add it to PATH, then run this again.
  pause
  exit /b 1
)

start "" "%URL%"
%PY% serve_nocache.py
if errorlevel 1 (
  echo.
  echo [WARN] serve_nocache.py failed — falling back to http.server
  %PY% -m http.server %PORT% --bind 127.0.0.1
  if errorlevel 1 (
    echo.
    echo [ERROR] Server failed. Is port %PORT% already in use?
    pause
    exit /b 1
  )
)

endlocal
