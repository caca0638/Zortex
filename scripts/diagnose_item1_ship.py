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

PORT = 8204
DEBUG_PORT = 9434
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_item1_diag_{int(time.time())}"

# os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
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

def capture(ws, filename):
    res = ws.call("Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(res["result"]["data"])
    out_dir = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950"
    path = os.path.join(out_dir, filename)
    with open(path, "wb") as f:
        f.write(img_data)
    print(f"[+] Saved screenshot: {filename}")
    return path

try:
    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json") as r:
        targets = json.loads(r.read())
    page = next((t for t in targets if str(PORT) in t.get("url", "") and t.get("type") == "page"), targets[0])
    ws = MinimalWebSocket(page["webSocketDebuggerUrl"])
    ws.call("Runtime.enable")

    ws.eval("if (typeof startGame === 'function') startGame();")
    time.sleep(1.0)

    # Move player to center and remove enemies for clean visibility
    ws.eval("""
    (() => {
        if (window.enemies) window.enemies.length = 0;
        if (window.pixiEnemiesContainer) window.pixiEnemiesContainer.removeChildren();
        if (window.player) {
            window.player.x = 640;
            window.player.y = 360;
            window.player.shield = 50;
            window.player.maxShield = 50;
        }
    })()
    """)
    time.sleep(0.5)

    # Step 1: Baseline (Shield 50/50, RimGlow ON, Bubble ON, Ring ON)
    capture(ws, "item1_diag_step1_baseline.png")

    # Step 2: Disable RimGlow Filter
    ws.eval("if (window.ZortexFX && window.ZortexFX.rimGlow) window.ZortexFX.rimGlow.setEnabled(false);")
    time.sleep(0.3)
    capture(ws, "item1_diag_step2_no_rimglow.png")

    # Step 3: Re-enable RimGlow, but hide shieldBubbleSprite
    ws.eval("""
    (() => {
        if (window.ZortexFX && window.ZortexFX.rimGlow) window.ZortexFX.rimGlow.setEnabled(true);
        if (window.player && window.player.shieldBubbleSprite) window.player.shieldBubbleSprite.visible = false;
    })()
    """)
    time.sleep(0.3)
    capture(ws, "item1_diag_step3_no_bubble.png")

    # Step 4: Hide shieldBubbleSprite AND shieldSprite (simulate Shield = 0)
    ws.eval("""
    (() => {
        if (window.player) {
            if (window.player.shieldBubbleSprite) window.player.shieldBubbleSprite.visible = false;
            if (window.player.shieldSprite) window.player.shieldSprite.visible = false;
        }
    })()
    """)
    time.sleep(0.3)
    capture(ws, "item1_diag_step4_no_shield.png")

    # Step 5: Check container children and hierarchy
    info = ws.eval("""
    (() => {
        const c = window.pixiPlayerContainer;
        return {
            childCount: c ? c.children.length : 0,
            hasFilters: c ? (c.filters && c.filters.length > 0) : false,
            filterNames: c && c.filters ? c.filters.map(f => f.constructor ? f.constructor.name : 'Filter') : [],
            children: c ? c.children.map(ch => ({
                type: ch.constructor ? ch.constructor.name : 'DisplayObject',
                visible: ch.visible,
                alpha: ch.alpha,
                blendMode: ch.blendMode,
                width: ch.width,
                height: ch.height
            })) : []
        };
    })()
    """)
    print("CONTAINER INFO:", json.dumps(info, indent=2))

finally:
    try:
        browser_proc.kill()
        app_proc.kill()
    except:
        pass

print("DIAGNOSIS EXPERIMENT COMPLETE.")
