import urllib.request
import json
import subprocess
import time
import sys
import os
import tempfile
import shutil

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8255
DEBUG_PORT = 9485
USER_DATA = os.path.join(tempfile.gettempdir(), f"zortex_wave1_check_{int(time.time())}")

# taskkill kaldirildi (F3 cozumu - kullanici pencerelerini oldurmez)
time.sleep(0.5)

py_exe = sys.executable
app_proc = subprocess.Popen([
    py_exe, "-m", "http.server", str(PORT), "--directory", r"C:\Users\user\Desktop\zort"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)

browser = find_browser()
browser_proc = subprocess.Popen([
    browser,
    f"--remote-debugging-port={DEBUG_PORT}",
    f"--user-data-dir={USER_DATA}",
    "--window-size=1280,720",
    "--headless=new",
    "--use-gl=angle",
    "--enable-webgl",
    "--enable-webgl2",
    f"http://127.0.0.1:{PORT}/index.html"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2.5)

try:
    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json") as r:
        targets = json.loads(r.read())
    page = next((t for t in targets if str(PORT) in t.get("url", "") and t.get("type") == "page"), targets[0])
    ws = MinimalWebSocket(page["webSocketDebuggerUrl"])
    ws.call("Runtime.enable")

    # Start game
    ws.eval("if (typeof startGame === 'function') startGame();")
    time.sleep(1.0)

    print("[*] Playing Wave 1...")
    # Simulate playing wave 1 for 15 seconds
    ws.eval("""
    (() => {
        window.__wave1Start = performance.now();
        if (window.player) {
            window.player.invulnerable = true;
        }
        window.__wave1Interval = setInterval(() => {
            if (window.player) {
                window.player.isFiring = true;
                // Move player around
                const t = (performance.now() - window.__wave1Start) * 0.002;
                window.player.x = 640 + Math.cos(t) * 150;
                window.player.y = 360 + Math.sin(t) * 100;
            }
        }, 50);
    })()
    """)

    time.sleep(15.0)

    # Check results
    res = ws.eval("""
    (() => {
        clearInterval(window.__wave1Interval);
        return {
            wave: window.wave,
            score: window.score,
            enemiesAlive: window.enemies ? window.enemies.length : 0,
            errors: window.__lastErrors || [],
            warnings: window.__lastWarnings || [],
            fps: window.fps || 0
        };
    })()
    """)

    print("\n================ WAVE 1 VERIFICATION RESULT ================")
    print(json.dumps(res, indent=2))
    print("============================================================")

    assert len(res["errors"]) == 0, f"Found console errors: {res['errors']}"
    assert len(res["warnings"]) == 0, f"Found console warnings: {res['warnings']}"
    print("[+] SUCCESS: Wave 1 passed with 0 console errors and 0 warnings!")

finally:
    try:
        browser_proc.kill()
        app_proc.kill()
    except:
        pass
    if os.path.exists(USER_DATA):
        shutil.rmtree(USER_DATA, ignore_errors=True)
