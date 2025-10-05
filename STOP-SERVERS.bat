@echo off
echo ========================================
echo   FERMANDO TUTTI I SERVER
echo ========================================
echo.

echo Fermando tutti i processi node...
taskkill /f /im node.exe >nul 2>&1

echo Fermando eventuali processi npm...
taskkill /f /im npm.cmd >nul 2>&1

echo Fermando eventuali processi vite...
taskkill /f /fi "WINDOWTITLE eq Frontend Server*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Backend Server*" >nul 2>&1

echo.
echo ✅ Tutti i server sono stati fermati!
echo.
pause