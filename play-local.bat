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

REM Free port if a previous local server is still listening
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue; if($c){ $c | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Write-Host ('[INFO] Port %PORT% busy (PID '+$_+') - stopping...'); Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 1 }"

if not exist "%~dp0serve_nocache.py" (
  echo [ERROR] serve_nocache.py not found in %CD%
  pause
  exit /b 1
)

REM Open browser after a short delay so the server can bind first
start "" cmd /c "ping -n 2 127.0.0.1 >nul & start %URL%"

%PY% "%~dp0serve_nocache.py"
if errorlevel 1 (
  echo.
  echo [WARN] serve_nocache.py failed - falling back to http.server
  %PY% -m http.server %PORT% --bind 127.0.0.1
  if errorlevel 1 (
    echo.
    echo [ERROR] Server failed. Port %PORT% still busy or Python cannot bind.
    echo Close other TheDDOS / play-local windows, then try again.
    pause
    exit /b 1
  )
)

endlocal
