import os
import shutil
import zipfile

src_dir = r"c:\Users\user\Desktop\zort"
dist_dir = r"c:\Users\user\Desktop\ZORTEX_Standalone_Oyun"
zip_path = r"c:\Users\user\Desktop\ZORTEX_Standalone_Kurulum.zip"

if os.path.exists(dist_dir):
    shutil.rmtree(dist_dir)
os.makedirs(dist_dir, exist_ok=True)

# 1. Copy essential files
essential_files = [
    "index.html",
    "pixi.v8.min.js",
    "app.py"
]

for f in essential_files:
    sf = os.path.join(src_dir, f)
    df = os.path.join(dist_dir, f)
    if os.path.exists(sf):
        shutil.copy2(sf, df)
        print(f"[+] Copied {f}")

# 2. Copy directories
essential_dirs = ["js", "assets"]
for d in essential_dirs:
    sd = os.path.join(src_dir, d)
    dd = os.path.join(dist_dir, d)
    if os.path.exists(sd):
        shutil.copytree(sd, dd)
        print(f"[+] Copied {d}/")

# 3. Copy vendor (only the minified files, no large .tgz archives)
os.makedirs(os.path.join(dist_dir, "vendor"), exist_ok=True)
vendor_files = ["pixi-filters.min.js", "tweakpane.min.js"]
for vf in vendor_files:
    svf = os.path.join(src_dir, "vendor", vf)
    dvf = os.path.join(dist_dir, "vendor", vf)
    if os.path.exists(svf):
        shutil.copy2(svf, dvf)
        print(f"[+] Copied vendor/{vf}")

# 4. Create ZORTEX_OYNA.bat
launcher_content = """@echo off
title ZORTEX: CYBER SURVIVOR
cd /d "%~dp0"

:: 1. Eger bilgisayarda Python kuruluysa app.py ile baslat
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [*] Python motoru tespit edildi. ZORTEX baslatiliyor...
    python app.py
    if %ERRORLEVEL% equ 0 exit /b 0
)

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [*] Python motoru tespit edildi. ZORTEX baslatiliyor...
    py app.py
    if %ERRORLEVEL% equ 0 exit /b 0
)

:: 2. Python yoksa: Microsoft Edge veya Chrome GPU Standalone Uygulama Modu
echo [*] Bagimsiz Masaustu Modu baslatiliyor...

set "EDGE="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined EDGE if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined EDGE if exist "%LocalAppData%\Microsoft\Edge\Application\msedge.exe" set "EDGE=%LocalAppData%\Microsoft\Edge\Application\msedge.exe"

set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

set "HTML_FILE=%~dp0index.html"
set "PROFILE_DIR=%~dp0.zortex_profile"
set "GPU_FLAGS=--disable-web-security --allow-file-access-from-files --ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy --gpu-no-context-lost --window-size=1366,768 --start-maximized --disable-infobars --app-id=zortex_cyber_survivor --autoplay-policy=no-user-gesture-required --enable-gamepad-extensions --high-dpi-support=1"

if defined EDGE (
    start "" "%EDGE%" --app="file:///%HTML_FILE:\=/%" --user-data-dir="%PROFILE_DIR%" %GPU_FLAGS%
    exit /b 0
)

if defined CHROME (
    start "" "%CHROME%" --app="file:///%HTML_FILE:\=/%" --user-data-dir="%PROFILE_DIR%" %GPU_FLAGS%
    exit /b 0
)

:: 3. Son Secenek: Varsayilan Tarayici
start "" "file:///%HTML_FILE:\=/%"
exit /b 0
"""

with open(os.path.join(dist_dir, "ZORTEX_OYNA.bat"), "w", encoding="utf-8", newline="\r\n") as f:
    f.write(launcher_content)
print("[+] Created ZORTEX_OYNA.bat")

# 5. Create Masaustune_Kisayol_Ekle.bat
shortcut_content = """@echo off
title ZORTEX - Masaustu Kisayol Olusturucu
cd /d "%~dp0"
echo ======================================================
echo    ZORTEX: CYBER SURVIVOR - KISAYOL KURULUMU
echo ======================================================
echo.
echo [*] Masaustunuze oyun kisayolu ekleniyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'ZORTEX - Cyber Survivor.lnk')); $Shortcut.TargetPath = [System.IO.Path]::Combine('%~dp0', 'ZORTEX_OYNA.bat'); $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'ZORTEX: Cyber Survivor'; $Shortcut.Save()"
echo.
echo [OK] Basarili! Masaustunuzde 'ZORTEX - Cyber Survivor' kisayolu olusturuldu.
echo.
pause
"""

with open(os.path.join(dist_dir, "Masaustune_Kisayol_Ekle.bat"), "w", encoding="utf-8", newline="\r\n") as f:
    f.write(shortcut_content)
print("[+] Created Masaustune_Kisayol_Ekle.bat")

# 6. Create BENI_OKU.txt
readme_content = """================================================================================
             ZORTEX: CYBER SURVIVOR - OYUNCU SURUMU (STANDALONE)
================================================================================

Bu paket, baska bir laptop veya bilgisayarda ZORTEX oyununu oynamak icin hazirlanmis
temiz, bagimsiz surumdur. Hicbir gelistirici veya admin dosyasi icermez.

YENI OZELLIKLER (20 MINUTES TILL DAWN & NOVA DRIFT ESINTILI SEFER SISTEMI):
--------------------------------------------------------------------------------
- SEFER HAZIRLIGI (LOADOUT BAY):
  * 10 Farkli Siber Savas Gemisi (Interceptor, Vanguard, Phantom, Titan, Spectre, Tesla Storm, Hive Carrier, Cryo Warden, Overclocker, Singularity)
  * 13 Fonksiyonel Silah Cephaneligi (Blaster, Spread-Shot, Plasma Beam, Railgun, Gudumlu Fuzeler, Tesla Bobini, Yorunge Bicaklari, Tekillik Topu, Siber Mayin, Savunma Uydusu, Prizma Lazeri, Golge Klonu, Gatling Vulcan)
  * 16 Noral Matris Cipi (Saldiri ve Savunma dallari, her dalda 4 kademe derin meta ilerleme)
  * Zor Kazanilan Hurda (Scrap) Meta Para Birimi

KURULUM VE OYNAMA TALIMATI:
--------------------------------------------------------------------------------
1. OYUNU HEMEN BASLATMAK ICIN:
   - 'ZORTEX_OYNA.bat' dosyasina cift tiklayin.
   - Oyun tam ekran/pencere uygulama modunda GPU donanim hizlandirma ile acilir.

2. MASAUSTUNE KISAYOL EKLEMEK ICIN (ISTEGE BAGLI):
   - 'Masaustune_Kisayol_Ekle.bat' dosyasina cift tiklayin.
   - Masaustunuzde 'ZORTEX - Cyber Survivor' adinda tek tikla acilan kisayol olusur.

SISTEM GEREKSINIMLERI:
--------------------------------------------------------------------------------
- Windows 10 veya Windows 11 (Microsoft Edge veya Google Chrome kurulu olmasi yeterlidir).
- Python, Node.js veya herhangi bir ek yazilim KURMANIZA GEREK YOKTUR!
- Klavye / Fare veya Gamepad (Xbox, DualShock/DualSense) ile tam uyumludur.

KONTROLLER:
--------------------------------------------------------------------------------
- SEFER HAZIRLIGI (LOADOUT BAY):
  * 1, 2, 3: Gemiler, Silahlar ve Noral Yongalar sekmeleri arasinda hizli gecis
  * TAB: Sekmeler arasinda sirayla gecis
  * ENTER: Sefere Basla (Launch Run)
  * ESC: Ana Menuye Don

- OYUN ICI:
  * Hareket: W, A, S, D veya Yon Tuslari / Sol Analog Cubuk
  * Nisan & Ates: Fare / Sag Analog Cubuk
  * Atilma (Dash): Space (Bosluk) / LB / L1
  * Silah Secimi: 1-9, 0 veya Fare Tekerlegi / Gamepad D-pad & RB / R1
  * Ulti / Ozel Yetenek: E veya Q / Y veya Sag Tetik
  * Duraklatma / Ayarlar: ESC / P / Start Butonu

Iyi oyunlar!
================================================================================
"""

with open(os.path.join(dist_dir, "BENI_OKU.txt"), "w", encoding="utf-8", newline="\r\n") as f:
    f.write(readme_content)
print("[+] Created BENI_OKU.txt")

# 7. Compress into clean ZIP
print("[*] Compressing clean standalone game into ZIP...")
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(dist_dir):
        for f in files:
            fp = os.path.join(root, f)
            arcname = os.path.relpath(fp, dist_dir)
            z.write(fp, arcname=arcname)

zip_size_mb = os.path.getsize(zip_path) / (1024 * 1024)
print(f"[OK] Done! Created {zip_path} ({zip_size_mb:.2f} MB)")
