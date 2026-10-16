import urllib.request
import json
import subprocess
import time
import sys
import os

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8191
DEBUG_PORT = 9421
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_testfilters_{int(time.time())}"

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

    time.sleep(1.5)

    res = ws.eval("""
    (() => {
        try {
            const rgb = new window.PIXI_FILTERS.RGBSplitFilter({ red: [-4, 0], green: [0, 0], blue: [4, 0] });
            const sw = new window.PIXI_FILTERS.ShockwaveFilter({ center: [640, 360], radius: 200, time: 0.5 });
            window.worldContainer.filters = [rgb];
            window.pixiApp.renderer.render(window.pixiApp.stage);
            window.worldContainer.filters = [sw];
            window.pixiApp.renderer.render(window.pixiApp.stage);
            window.worldContainer.filters = [];
            return { ok: true, rgb: !!rgb, sw: !!sw };
        } catch(e) {
            return { ok: false, error: e.stack || e.message };
        }
    })()
    """)
    print("[*] RGBSplitFilter and ShockwaveFilter render test result:", res)
finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
