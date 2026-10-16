import urllib.request
import json
import subprocess
import time
import sys
import os
import base64

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8155
DEBUG_PORT = 9385
USER_DATA = r"C:\Users\user\Desktop\zort\.app_profile_diag5"

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
    selectProfile('Ajan Alpha');
    startGame();
    player.godMode = true;
    """)
    time.sleep(1.5)

    # Test Case C: Both worldContainer.filters = [cm] AND emissiveLayer.filters = [bloom]
    ws.eval("""
    window.worldContainer.filters = [window.colorMatrixFilter];
    window.pixiEmissiveLayer.filters = [window.ZortexFX.bloom.filter];
    window.pixiApp.render();
    """)
    time.sleep(0.5)
    shot_c = ws.call("Page.captureScreenshot", {"format": "png"})
    with open(r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\test_both_filters.png", "wb") as f:
        f.write(base64.b64decode(shot_c.get("result", {}).get("data") or shot_c.get("data")))

    # Now test: What if worldContainer has NO filters, and ColorMatrixFilter is on stage or not used?
    ws.eval("""
    window.worldContainer.filters = null; // No filter on parent!
    window.pixiEmissiveLayer.filters = [window.ZortexFX.bloom.filter];
    window.pixiApp.render();
    """)
    time.sleep(0.5)
    shot_d = ws.call("Page.captureScreenshot", {"format": "png"})
    with open(r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\test_only_bloom_on_emissive.png", "wb") as f:
        f.write(base64.b64decode(shot_d.get("result", {}).get("data") or shot_d.get("data")))

    print("[*] Tested Case C (Both) and Case D (Only Bloom on Emissive, Parent Unfiltered)")

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
