@echo off
echo ========================================
echo   TROVA E APRI DASHBOARD
echo ========================================
echo.

echo 🔍 Cercando frontend attivo...

REM Testa porta 5173
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host '✅ Frontend trovato su porta 5173'; start 'http://localhost:5173'; exit 0 } catch { Write-Host '❌ Porta 5173 non disponibile' }" 2>nul

REM Testa porta 5174
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5174/' -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host '✅ Frontend trovato su porta 5174'; start 'http://localhost:5174'; exit 0 } catch { Write-Host '❌ Porta 5174 non disponibile' }" 2>nul

REM Testa porta 5175
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5175/' -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host '✅ Frontend trovato su porta 5175'; start 'http://localhost:5175'; exit 0 } catch { Write-Host '❌ Porta 5175 non disponibile' }" 2>nul

echo.
echo ❓ Frontend non trovato su porte comuni
echo 💡 Controlla l'output del server frontend per la porta corretta
echo.
pause