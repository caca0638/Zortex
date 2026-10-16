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

PORT = 8221
DEBUG_PORT = 9451
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_item1_exp_{int(time.time())}"

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

    # Move player away from center, e.g. to (400, 300)
    ws.eval("""
    (() => {
        if (window.enemies) window.enemies.length = 0;
        if (window.pixiEnemiesContainer) window.pixiEnemiesContainer.removeChildren();
        if (window.player) {
            window.player.x = 400;
            window.player.y = 300;
            window.player.shield = 50;
            window.player.maxShield = 50;
        }
    })()
    """)
    time.sleep(0.5)

    # Baseline with player at 400, 300
    capture(ws, "item1_exp_baseline_at_400_300")

    # Turn off pixiHazardsBelow
    ws.eval("if (window.pixiHazardsBelow) window.pixiHazardsBelow.visible = false;")
    time.sleep(0.2)
    capture(ws, "item1_exp_no_hazards_below")

    # Turn off shieldBubbleSprite
    ws.eval("if (window.player && window.player.shieldBubbleSprite) window.player.shieldBubbleSprite.visible = false;")
    time.sleep(0.2)
    capture(ws, "item1_exp_no_bubble")

    # Turn off shieldSprite (ring)
    ws.eval("if (window.player && window.player.shieldSprite) window.player.shieldSprite.visible = false;")
    time.sleep(0.2)
    capture(ws, "item1_exp_no_ring")

    # Turn off RimGlow
    ws.eval("if (window.ZortexFX && window.ZortexFX.rimGlow) window.ZortexFX.rimGlow.setEnabled(false);")
    time.sleep(0.2)
    capture(ws, "item1_exp_no_rimglow")

    # Re-enable all, but check sprite alone
    ws.eval("""
    (() => {
        const sp = window.player ? window.player.sprite : null;
        console.log('SP:', sp ? { x: sp.x, y: sp.y, vis: sp.visible, alpha: sp.alpha, parent: sp.parent ? sp.parent.label : null } : null);
    })()
    """)

finally:
    browser_proc.kill()
    app_proc.kill()
