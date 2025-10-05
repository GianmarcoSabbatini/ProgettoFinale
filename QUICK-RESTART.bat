@echo off
echo ========================================
echo   TEST RAPIDO - RIAVVIO SISTEMA
echo ========================================
echo.

REM Ferma tutto
echo [1/3] Fermando server esistenti...
taskkill /f /im node.exe >nul 2>&1

REM Avvia backend
echo [2/3] Riavviando backend...
cd /d "%~dp0dashboard-backend"
start /min "Backend" cmd /c "node server.js"

REM Aspetta e avvia frontend
echo [3/3] Riavviando frontend...
timeout /t 2 /nobreak >nul
cd /d "%~dp0dashboard-frontend"
start /min "Frontend" cmd /c "npm run dev"

REM Aspetta che tutto sia pronto
echo.
echo ⏱️  Attendendo che i server si avviino...
timeout /t 5 /nobreak >nul

REM Testa la connettività
echo 🔍 Testando connettività...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host '✅ Frontend OK' -ForegroundColor Green } catch { Write-Host '❌ Frontend non raggiungibile' -ForegroundColor Red }"

REM Apri il browser
echo.
echo 🚀 Aprendo browser...
start "" http://localhost:5173

echo.
echo Sistema riavviato! Premi un tasto per chiudere...
pause >nul