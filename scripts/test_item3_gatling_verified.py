import urllib.request
import json
import subprocess
import time
import sys
import os
import base64

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
ARTIFACTS_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8254
DEBUG_PORT = 9484
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_item3_{int(time.time())}"

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

logs = []

def capture_screenshot(ws, path):
    res = ws.call("Page.captureScreenshot", {"format": "png"})
    data = res.get("result", {}).get("data", "")
    if data:
        with open(path, "wb") as f:
            f.write(base64.b64decode(data))
        print(f"Captured: {os.path.basename(path)}")

try:
    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json") as r:
        targets = json.loads(r.read())
    page = next((t for t in targets if str(PORT) in t.get("url", "") and t.get("type") == "page"), targets[0])
    ws = MinimalWebSocket(page["webSocketDebuggerUrl"])
    ws.call("Runtime.enable")
    ws.call("Page.enable")

    # Setup error tracking in browser
    ws.call("Runtime.evaluate", {"expression": """
        window.__testErrors = [];
        window.__testWarnings = [];
        window.addEventListener('error', e => window.__testErrors.push(e.message || String(e)));
        window.addEventListener('unhandledrejection', e => window.__testErrors.push(String(e.reason)));
        const _origWarn = console.warn;
        console.warn = function(...args) {
            window.__testWarnings.push(args.join(' '));
            _origWarn.apply(console, args);
        };
        const _origErr = console.error;
        console.error = function(...args) {
            window.__testErrors.push(args.join(' '));
            _origErr.apply(console, args);
        };
        'listeners_attached';
    """})

    # 1. Start the game
    ws.call("Runtime.evaluate", {"expression": """
        (() => {
            if (typeof closeProfileMenu === 'function') closeProfileMenu();
            if (typeof startGame === 'function') startGame();
            window.player.health = window.player.maxHealth;
            window.player.shield = window.player.maxShield;
            // Clear all initial enemies for clean inspection
            if (window.enemies) window.enemies.length = 0;
            return 'game_started';
        })()
    """})
    time.sleep(1.0)

    # 2. Check GatlingBeamFXManager status
    check_res = ws.call("Runtime.evaluate", {"expression": """
        JSON.stringify({
            hasGatlingBeams: !!(window.ZortexFX && window.ZortexFX.gatlingBeams),
            poolLength: window.ZortexFX?.gatlingBeams?.pool?.length || 0,
            hasTextures: !!(window.ZortexFX?.gatlingBeams?.beamTexture),
            hasBarrelOverlay: !!(window.ZortexFX?.gatlingBeams?.barrelOverlaySprite)
        })
    """})
    print("Gatling Manager Status:", check_res.get("result", {}).get("result", {}).get("value"))

    # 3. Test Evolution Cinematic Trigger
    ws.call("Runtime.evaluate", {"expression": """
        (() => {
            window.ZortexFX.triggerEvolutionCinematic('gatling_laser', window.player);
            return 'cinematic_triggered';
        })()
    """})
    time.sleep(0.3)
    capture_screenshot(ws, os.path.join(ARTIFACTS_DIR, "item3_evolution_cinematic_banner.png"))
    time.sleep(2.0) # let banner fade

    # 4. Scenario: 1 Beam Normal
    ws.call("Runtime.evaluate", {"expression": """
        (() => {
            window.player.hasGatlingLaser = true;
            window.player.projectiles = 1;
            window.player.isUltimateActive = false;
            window.mouse.down = true;
            window.player.angle = 0; // facing right
            return '1_beam_normal';
        })()
    """})
    time.sleep(0.4) # let spool-up ramp to 100%
    capture_screenshot(ws, os.path.join(ARTIFACTS_DIR, "item3_gatling_1beam_normal.png"))

    # 5. Scenario: 2 Beams Normal
    ws.call("Runtime.evaluate", {"expression": """
        (() => {
            window.player.projectiles = 2;
            return '2_beam_normal';
        })()
    """})
    time.sleep(0.3)
    capture_screenshot(ws, os.path.join(ARTIFACTS_DIR, "item3_gatling_2beam_normal.png"))

    # 6. Scenario: 4 Beams Normal
    ws.call("Runtime.evaluate", {"expression": """
        (() => {
            window.player.projectiles = 4;
            return '4_beam_normal';
        })()
    """})
    time.sleep(0.3)
    capture_screenshot(ws, os.path.join(ARTIFACTS_DIR, "item3_gatling_4beam_normal.png"))

    # 7. Scenario: 1 Beam Overdrive
    ws.call("Runtime.evaluate", {"expression": """
        (() => {
            window.player.projectiles = 1;
            window.player.isUltimateActive = true;
            return '1_beam_overdrive';
        })()
    """})
    time.sleep(0.3)
    capture_screenshot(ws, os.path.join(ARTIFACTS_DIR, "item3_gatling_1beam_overdrive.png"))

    # 8. Scenario: 2 Beams Overdrive
    ws.call("Runtime.evaluate", {"expression": """
        (() => {
            window.player.projectiles = 2;
            window.player.isUltimateActive = true;
            return '2_beam_overdrive';
        })()
    """})
    time.sleep(0.3)
    capture_screenshot(ws, os.path.join(ARTIFACTS_DIR, "item3_gatling_2beam_overdrive.png"))

    # 9. Scenario: 4 Beams Overdrive
    ws.call("Runtime.evaluate", {"expression": """
        (() => {
            window.player.projectiles = 4;
            window.player.isUltimateActive = true;
            return '4_beam_overdrive';
        })()
    """})
    time.sleep(0.3)
    capture_screenshot(ws, os.path.join(ARTIFACTS_DIR, "item3_gatling_4beam_overdrive.png"))

    # 10. Scenario: 100+ enemies scene with Gatling firing to test frame budget & readability
    bench_res = ws.call("Runtime.evaluate", {"expression": """
        (() => {
            window.player.invulnerable = true;
            window.player.health = window.player.maxHealth;
            window.player.shield = window.player.maxShield;
            // Prevent levelup interruption by maxing level or auto-choosing
            if (window.gameState === 'LEVELUP' && typeof window.chooseUpgrade === 'function') {
                window.chooseUpgrade(0);
            }
            // Spawn 110 enemies
            while (window.enemies.length < 110) {
                const ang = Math.random() * Math.PI * 2;
                const dist = 180 + Math.random() * 350;
                window.enemies.push(new window.Enemy(
                    window.player.x + Math.cos(ang) * dist,
                    window.player.y + Math.sin(ang) * dist,
                    'scout'
                ));
            }
            window.player.projectiles = 3;
            window.mouse.x = window.player.x + 350;
            window.mouse.y = window.player.y;
            window.mouse.down = true;
            if (window.gameState === 'LEVELUP' && typeof window.chooseUpgrade === 'function') {
                window.chooseUpgrade(0);
            }
            return { enemyCount: window.enemies.length, fps: window.fpsSmoothed };
        })()
    """})
    time.sleep(0.4)
    ws.call("Runtime.evaluate", {"expression": "if (window.gameState === 'LEVELUP' && typeof window.chooseUpgrade === 'function') window.chooseUpgrade(0);"})
    time.sleep(0.6)
    capture_screenshot(ws, os.path.join(ARTIFACTS_DIR, "item3_gatling_100enemies_battle.png"))

    # Check console errors and warnings
    err_res = ws.call("Runtime.evaluate", {"expression": "JSON.stringify({ errors: window.__testErrors || [], warnings: window.__testWarnings || [] })"})
    err_data = json.loads(err_res.get("result", {}).get("result", {}).get("value", "{}"))
    errs = err_data.get("errors", [])
    warns = err_data.get("warnings", [])
    print(f"Total console warnings: {len(warns)}")
    print(f"Total console errors: {len(errs)}")
    if warns:
        for w in warns:
            print("WARNING LOG:", w)
    if errs:
        for e in errs:
            print("ERROR LOG:", e)

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
