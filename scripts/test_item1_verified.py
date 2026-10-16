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

PORT = 8247
DEBUG_PORT = 9477
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_item1_final_{int(time.time())}"

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

    # Start game
    ws.eval("if (typeof startGame === 'function') startGame();")
    time.sleep(1.0)

    # Disable random enemy spawns during ship verification to keep arena clear
    ws.eval("""
    (() => {
        window.spawnEnemy = () => {};
        if (window.enemies) window.enemies.length = 0;
        if (window.enemyBullets) window.enemyBullets.length = 0;
        if (window.pixiEnemiesContainer) window.pixiEnemiesContainer.removeChildren();
        if (window.pixiEnemyBulletsContainer) window.pixiEnemyBulletsContainer.removeChildren();
        if (window.player) {
            window.player.x = 640;
            window.player.y = 360;
            window.player.invulnerable = true;
        }
    })()
    """)
    time.sleep(0.3)

    # 1. TEST 3 SHIP CLASSES x 2 SHIELD STATES
    classes = ['interceptor', 'titan', 'spectre']
    for cls in classes:
        # State A: Shield ON (50/50)
        ws.eval(f"""
        (() => {{
            if (window.player) {{
                window.player.shipClassId = '{cls}';
                window.player.initPixiSprites();
                window.player.shield = 50;
                window.player.maxShield = 50;
            }}
        }})()
        """)
        time.sleep(0.3)
        capture(ws, f"item1_{cls}_shield_on")

        # State B: Shield OFF (0/50)
        ws.eval("""
        (() => {
            if (window.player) {
                window.player.shield = 0;
                window.player.maxShield = 50;
            }
        })()
        """)
        time.sleep(0.3)
        capture(ws, f"item1_{cls}_shield_off")

    # 2. TEST DASH STATE
    ws.eval("""
    (() => {
        if (window.player) {
            window.player.shipClassId = 'interceptor';
            window.player.initPixiSprites();
            window.player.shield = 50;
            window.player.maxShield = 50;
            window.player.dash();
        }
    })()
    """)
    time.sleep(0.1)
    capture(ws, "item1_dash_state")

    # 3. TEST DAMAGE / RGBSPLIT STATE
    ws.eval("""
    (() => {
        if (window.player) {
            window.player.takeDamage(10);
        }
        if (window.ZortexFX) {
            window.ZortexFX.triggerRGBSplit(14, 0.45);
        }
    })()
    """)
    time.sleep(0.1)
    capture(ws, "item1_damage_rgbsplit")

    # 4. TEST OVERDRIVE STATE
    ws.eval("""
    (() => {
        if (window.player) {
            window.player.isUltimateActive = true;
            window.player.ultimateTimer = 5.0;
        }
    })()
    """)
    time.sleep(0.2)
    capture(ws, "item1_overdrive_state")

    # Telemetry and Errors
    errors = ws.eval("window.__lastErrors || []")
    warnings = ws.eval("window.__lastWarnings || []")
    print("ERRORS:", errors)
    print("WARNINGS:", warnings)
    print("MADDE 1 VERIFICATION TESTS COMPLETED.")

finally:
    try:
        browser_proc.kill()
        app_proc.kill()
    except:
        pass
