import urllib.request
import json
import subprocess
import time
import sys
import os

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8170
DEBUG_PORT = 9400
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_fresh_{int(time.time())}"

# os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
time.sleep(0.5)

py_exe = sys.executable
app_proc = subprocess.Popen([
    py_exe, "-m", "http.server", str(PORT), "--directory", r"C:\Users\user\Desktop\zort"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.0)

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
    "--disable-http-cache",
    f"http://127.0.0.1:{PORT}/index.html"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(3.0)

try:
    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json") as r:
        targets = json.loads(r.read())
    page = next((t for t in targets if str(PORT) in t.get("url", "") and t.get("type") == "page"), targets[0])
    ws = MinimalWebSocket(page["webSocketDebuggerUrl"])
    ws.call("Runtime.enable")
    ws.call("Page.enable")

    time.sleep(1.5)
    ws.eval("""
    window.__perfErrors = [];
    window.onerror = function(msg, src, lin, col, err) {
        window.__perfErrors.push({
            msg: String(msg),
            src: String(src),
            lin: lin,
            col: col,
            stack: err ? err.stack : 'no-stack'
        });
    };

    selectProfile('Ajan Alpha');
    startGame();
    player.godMode = true;
    player.hasGatlingLaser = true;
    autoFire = true;
    mouse.down = true;

    for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        const dist = 220 + (i % 3) * 40;
        const ex = player.x + Math.cos(ang) * dist;
        const ey = player.y + Math.sin(ang) * dist;
        const e = new Enemy(ex, ey, 'scout');
        enemies.push(e);
    }
    """)

    time.sleep(2.0)
    errs = ws.eval("window.__perfErrors")
    print("[*] Captured errors with fresh profile & disable-http-cache:")
    print(json.dumps(errs, indent=2))

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
