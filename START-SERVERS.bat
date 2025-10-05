@echo off
echo ========================================
echo   DASHBOARD PROJECT - AVVIO RAPIDO
echo ========================================
echo.

REM Ferma tutti i processi node esistenti
echo [1/4] Fermando processi node esistenti...
taskkill /f /im node.exe >nul 2>&1

REM Avvia il backend
echo [2/4] Avviando server backend...
cd /d "%~dp0dashboard-backend"
start "Backend Server" cmd /k "echo BACKEND ATTIVO & node server.js"

REM Aspetta 3 secondi
echo [3/4] Attendendo inizializzazione backend...
timeout /t 3 /nobreak >nul

REM Avvia il frontend
echo [4/4] Avviando server frontend...
cd /d "%~dp0dashboard-frontend"
start "Frontend Server" cmd /k "echo FRONTEND ATTIVO & npm run dev"

echo.
echo ✅ SERVERS AVVIATI!
echo 🔗 Frontend: http://localhost:5173
echo 🔗 Backend:  http://localhost:3001
echo.
echo Premi un tasto per aprire il browser...
pause >nul

REM Apri il browser
start "" http://localhost:5173

echo.
echo 🚀 Sistema pronto per il test!
echo Premi un tasto per chiudere...
pause >nul