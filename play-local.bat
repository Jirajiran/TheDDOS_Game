@echo off
setlocal
cd /d "%~dp0"

set PORT=8080
set URL=http://127.0.0.1:%PORT%/

echo.
echo  WantToPlay — local HTTP
echo  Folder: %CD%
echo  URL:    %URL%
echo  Close this window to stop the server.
echo.

rem Prefer `py` launcher, then `python`
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
%PY% -m http.server %PORT% --bind 127.0.0.1
if errorlevel 1 (
  echo.
  echo [ERROR] Server failed. Is port %PORT% already in use?
  pause
  exit /b 1
)

endlocal
