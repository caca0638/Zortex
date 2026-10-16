@echo off
title ZORTEX: CYBER SURVIVOR - Desktop Launcher
cd /d "%~dp0"

:: -----------------------------------------------------------------------------
:: ZORTEX: CYBER SURVIVOR - MASAUSTU BASLATICI (BATCH LAUNCHER)
:: -----------------------------------------------------------------------------

:: 1. ONCELIK: Python Varsa app.py ile Yerel Masaustu Cekirdegini Baslat
where python >nul 2>nul
if %ERRORLEVEL% equ 0 goto :launch_python

where py >nul 2>nul
if %ERRORLEVEL% equ 0 goto :launch_py

:: Python bulunamadiysa dogrudan tarayici uygulama moduna gec
goto :launch_browser_app

:launch_python
echo [*] Python motoru tespit edildi. ZORTEX masaustu uygulamasi baslatiliyor...
python app.py
if %ERRORLEVEL% neq 0 (
    echo [!] Python ile baslatma basarisiz oldu, tarayici moduna geciliyor...
    goto :launch_browser_app
)
exit /b 0

:launch_py
echo [*] Python (py) motoru tespit edildi. ZORTEX masaustu uygulamasi baslatiliyor...
py app.py
if %ERRORLEVEL% neq 0 (
    echo [!] Python ile baslatma basarisiz oldu, tarayici moduna geciliyor...
    goto :launch_browser_app
)
exit /b 0

:launch_browser_app
:: 2. ALTERNATIF: Edge veya Chrome Standalone App Modu (GPU Hizlandirilmis)
set "EDGE="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined EDGE if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined EDGE if exist "%LocalAppData%\Microsoft\Edge\Application\msedge.exe" set "EDGE=%LocalAppData%\Microsoft\Edge\Application\msedge.exe"

set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

set "HTML_FILE=%~dp0index.html"
set "PROFILE_DIR=%~dp0.app_profile"
set "GPU_FLAGS=--ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy --gpu-no-context-lost --window-size=1366,768 --start-maximized --disable-infobars --app-id=zortex_cyber_survivor"

if defined EDGE (
    echo [*] Microsoft Edge Uygulama Modunda baslatiliyor...
    start "" "%EDGE%" --app="file:///%HTML_FILE:\=/%" --user-data-dir="%PROFILE_DIR%" %GPU_FLAGS%
    exit /b 0
)

if defined CHROME (
    echo [*] Google Chrome Uygulama Modunda baslatiliyor...
    start "" "%CHROME%" --app="file:///%HTML_FILE:\=/%" --user-data-dir="%PROFILE_DIR%" %GPU_FLAGS%
    exit /b 0
)

:: 3. SON SECENEK: Varsayilan Sistem Tarayicisi
echo [*] Varsayilan sistem tarayicisi ile baslatiliyor...
start "" "%HTML_FILE%"
exit /b 0
