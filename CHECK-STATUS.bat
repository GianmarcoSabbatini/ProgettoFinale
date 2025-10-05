@echo off
echo ========================================
echo   VERIFICA STATO SERVER
echo ========================================
echo.

echo 🔍 Controllando processi node...
tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe" >nul
if %errorlevel%==0 (
    echo ✅ Processi node attivi trovati
    tasklist /fi "imagename eq node.exe"
) else (
    echo ❌ Nessun processo node attivo
)

echo.
echo 🌐 Testando connettività...

echo Frontend (5173):
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 3; Write-Host '✅ FRONTEND OK - Status:' $response.StatusCode -ForegroundColor Green } catch { Write-Host '❌ Frontend non raggiungibile' -ForegroundColor Red }"

echo.
echo Backend (3001):
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/messages' -TimeoutSec 3; Write-Host '✅ BACKEND OK - Messaggi trovati:' $response.Count -ForegroundColor Green } catch { Write-Host '❌ Backend non raggiungibile' -ForegroundColor Red }"

echo.
echo 🔗 Link utili:
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001/api/messages
echo.
pause