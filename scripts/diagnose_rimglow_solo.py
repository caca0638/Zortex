import urllib.request
import json
import time
import sys
import os
import subprocess
import base64

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8229
DEBUG_PORT = 9459
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_rimglow_bug_{int(time.time())}"

# os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
time.sleep(0.5)

app_proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--directory", r"C:\Users\user\Desktop\zort"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)

browser = find_browser()
browser_proc = subprocess.Popen([
    browser, f"--remote-debugging-port={DEBUG_PORT}", f"--user-data-dir={USER_DATA}",
    "--window-size=1280,720", "--headless=new", "--use-gl=angle", "--enable-webgl", "--enable-webgl2",
    f"http://127.0.0.1:{PORT}/index.html"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2.5)

def capture(ws, name):
    res = ws.call("Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(res["result"]["data"])
    out_dir = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950"
    path = os.path.join(out_dir, f"{name}.png")
    with open(path, "wb") as f:
        f.write(img_data)
    print(f"[+] Screen captured: {name}.png")
    return path

try:
    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json") as r:
        targets = json.loads(r.read())
    page = next((t for t in targets if str(PORT) in t.get("url", "") and t.get("type") == "page"), targets[0])
    ws = MinimalWebSocket(page["webSocketDebuggerUrl"])
    ws.call("Runtime.enable")

    ws.eval("if (typeof startGame === 'function') startGame();")
    time.sleep(1.0)

    # Hide everything EXCEPT pixiShipBodyContainer
    ws.eval("""
    (() => {
        window.spawnEnemy = () => {};
        if (window.enemies) window.enemies.length = 0;
        if (window.pixiBackgroundLayer) window.pixiBackgroundLayer.visible = false;
        if (window.pixiEntitiesLayer) window.pixiEntitiesLayer.visible = false;
        if (window.pixiEmissiveLayer) window.pixiEmissiveLayer.visible = false;
        if (window.player) {
            window.player.shield = 0;
            window.player.maxShield = 0;
            if (window.player.shieldBubbleSprite) window.player.shieldBubbleSprite.visible = false;
            if (window.player.shieldSprite) window.player.shieldSprite.visible = false;
            window.player.x = 640;
            window.player.y = 360;
        }
    })()
    """)
    time.sleep(0.3)

    # Test A: Ship with NO filter
    ws.eval("""
    (() => {
        if (window.pixiShipBodyContainer) window.pixiShipBodyContainer.filters = null;
    })()
    """)
    time.sleep(0.3)
    capture(ws, "ship_solo_no_filter")

    # Test B: Ship with RimGlowFilter
    ws.eval("""
    (() => {
        if (window.ZortexFX && window.ZortexFX.rimGlow && window.pixiShipBodyContainer) {
            window.ZortexFX.rimGlow.setEnabled(true);
        }
    })()
    """)
    time.sleep(0.3)
    capture(ws, "ship_solo_with_rimglow")

    diag = ws.eval("""
    (() => {
        const cont = window.pixiShipBodyContainer;
        const sp = window.player ? window.player.sprite : null;
        return {
            contBounds: cont ? cont.getBounds() : null,
            contFilters: cont && cont.filters ? cont.filters.length : 0,
            spBounds: sp ? sp.getBounds() : null,
            spPos: sp ? { x: sp.x, y: sp.y } : null,
            spVis: sp ? sp.visible : null
        };
    })()
    """)
    print("DIAG:", json.dumps(diag, indent=2))

finally:
    browser_proc.kill()
    app_proc.kill()
