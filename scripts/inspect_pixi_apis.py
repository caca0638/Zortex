import urllib.request
import json
import subprocess
import time
import sys
import os

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8180
DEBUG_PORT = 9410
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_inspect_{int(time.time())}"

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
    time.sleep(1.0)

    res = ws.eval("""
    (() => {
        const pixiKeys = Object.keys(window.PIXI || {});
        const shaderFilters = pixiKeys.filter(k => 
            /filter|shader|program|mesh|uniform/i.test(k)
        );
        return {
            totalKeys: pixiKeys.length,
            shaderFilters,
            FilterType: typeof window.PIXI.Filter,
            GlProgramType: typeof window.PIXI.GlProgram,
            MeshType: typeof window.PIXI.Mesh,
            MeshSimpleType: typeof window.PIXI.MeshSimple,
            MeshRopeType: typeof window.PIXI.MeshRope,
            SpriteType: typeof window.PIXI.Sprite,
            TilingSpriteType: typeof window.PIXI.TilingSprite
        };
    })()
    """)
    print("[*] Pixi v8 API Verification:\n", json.dumps(res, indent=2))

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
