@echo off
setlocal
cd /d "%~dp0"

echo Iniciando Gimnasio Chang en http://localhost:4315/
call npm.cmd run dev -- --host 127.0.0.1 --port 4315 --background
if errorlevel 1 (
  echo.
  echo No se pudo iniciar el servidor local.
  pause
  exit /b 1
)

start "" "http://localhost:4315/"
endlocal
