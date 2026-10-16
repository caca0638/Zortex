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

PORT = 8182
DEBUG_PORT = 9412
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_phase2_{int(time.time())}"

# os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
time.sleep(0.5)

py_exe = sys.executable
print(f"[*] Starting HTTP server on port {PORT}...")
app_proc = subprocess.Popen([
    py_exe, "-m", "http.server", str(PORT), "--directory", r"C:\Users\user\Desktop\zort"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.0)

browser = find_browser()
print(f"[*] Launching browser with hardware GPU acceleration...")
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
    ws.call("Log.enable")

    print("[*] Waiting for PixiJS, Nebula and textures initialization...")
    is_ready = False
    for i in range(30):
        check = ws.eval("""
        (() => {
            return {
                pixiReady: typeof PIXI !== 'undefined' && !!window.pixiApp && !!window.pixiApp.renderer && !!window.worldContainer,
                texturesReady: typeof pixiTextures !== 'undefined' && !!pixiTextures && !!pixiTextures.ship_interceptor && !!pixiTextures.asteroid_debris,
                nebulaReady: !!window.ZortexFX && !!window.ZortexFX.nebula && window.ZortexFX.nebula.isInitialized,
                gameReady: typeof startGame === 'function' && typeof selectProfile === 'function'
            };
        })()
        """)
        if check and check.get("pixiReady") and check.get("texturesReady") and check.get("nebulaReady") and check.get("gameReady"):
            print(f"[+] All systems ready at iteration {i}: {check}")
            is_ready = True
            break
        time.sleep(0.3)

    assert is_ready, "Game / Nebula failed to initialize within timeout!"

    print("[*] Starting game and establishing Phase 2 scenario...")
    ws.eval("""
    window.__perfErrors = [];
    window.__perfWarnings = [];
    window.onerror = function(msg, src, lin, col, err) {
        window.__perfErrors.push(String(msg) + ' at ' + lin + ':' + col);
    };
    const origWarn = console.warn;
    console.warn = function(...args) {
        window.__perfWarnings.push(args.map(String).join(' '));
        origWarn.apply(console, args);
    };

    selectProfile('Ajan Alpha');
    startGame();
    player.godMode = true;
    player.nextLevelXp = 999999999;
    const ov = document.getElementById('upgradeOverlay');
    if (ov) ov.classList.add('hidden');

    // Spawn combat entities and simulate movement
    for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const dist = 240 + (i % 2) * 50;
        const ex = player.x + Math.cos(ang) * dist;
        const ey = player.y + Math.sin(ang) * dist;
        enemies.push(new Enemy(ex, ey, 'scout'));
    }
    """)

    time.sleep(1.0)

    print("[*] Testing player movement and dynamic warp streaking...")
    # Simulate movement keys (W + D)
    ws.eval("""
    keys['KeyW'] = true;
    keys['KeyD'] = true;
    """)
    time.sleep(1.2)

    movement_info = ws.eval("""
    (() => {
        let maxStretch = 1.0;
        let warpCount = 0;
        let asteroidCount = 0;
        if (typeof starfield !== 'undefined' && starfield && starfield.stars) {
            for (let s of starfield.stars) {
                if (s.isWarpable) {
                    warpCount++;
                    if (s.sprite && s.sprite.scale.y > maxStretch) {
                        maxStretch = s.sprite.scale.y;
                    }
                }
                if (s.isAsteroid) asteroidCount++;
            }
        }
        return {
            playerVx: player.vx,
            playerVy: player.vy,
            playerSpeed: Math.hypot(player.vx, player.vy),
            maxWarpStretch: maxStretch,
            warpStarCount: warpCount,
            asteroidCount: asteroidCount
        };
    })()
    """)
    print("[*] Movement & Warp Streaking Results:\n", json.dumps(movement_info, indent=2))

    # Test Dash warp surge
    print("[*] Triggering player dash for maximum warp streak verification...")
    ws.eval("player.dash();")
    time.sleep(0.1)
    dash_info = ws.eval("""
    (() => {
        let maxDashStretch = 1.0;
        if (typeof starfield !== 'undefined' && starfield && starfield.stars) {
            for (let s of starfield.stars) {
                if (s.isWarpable && s.sprite && s.sprite.scale.y > maxDashStretch) {
                    maxDashStretch = s.sprite.scale.y;
                }
            }
        }
        return {
            isDashing: player.isDashing,
            dashSpeed: player.dashSpeed,
            maxDashStretch: maxDashStretch
        };
    })()
    """)
    print("[*] Dash Warp Surge Results:\n", json.dumps(dash_info, indent=2))

    # Release movement keys
    ws.eval("keys['KeyW'] = false; keys['KeyD'] = false;")

    # Test wave palette lerping
    print("[*] Testing wave progression color shift...")
    ws.eval("""
    wave = 4;
    """)
    time.sleep(1.5)

    nebula_info = ws.eval("""
    (() => {
        const neb = window.ZortexFX ? window.ZortexFX.nebula : null;
        if (!neb) return null;
        return {
            isInitialized: neb.isInitialized,
            spriteVisible: neb.sprite ? neb.sprite.visible : false,
            spriteWidth: neb.sprite ? neb.sprite.width : 0,
            spriteHeight: neb.sprite ? neb.sprite.height : 0,
            filterResolution: neb.filter ? neb.filter.resolution : 0,
            currentA: neb.currentA,
            currentB: neb.currentB,
            currentC: neb.currentC,
            time: neb.time
        };
    })()
    """)
    print("[*] Nebula Status & Palette Verification:\n", json.dumps(nebula_info, indent=2))

    # Measure FPS
    fps_samples = []
    for _ in range(10):
        time.sleep(0.3)
        cur_fps = ws.eval("window.ZortexFX && window.ZortexFX.metrics ? window.ZortexFX.metrics.fps : (window.fpsSmoothed || 0)")
        if cur_fps:
            fps_samples.append(cur_fps)

    avg_fps = sum(fps_samples) / max(1, len(fps_samples))
    min_fps = min(fps_samples) if fps_samples else 0
    print(f"[*] Average Phase 2 Combat FPS: {avg_fps:.1f} FPS (Min: {min_fps} FPS, Samples: {fps_samples})")

    # Capture Phase 2 Verified Screenshot
    shot_data = ws.call("Page.captureScreenshot", {"format": "png"})
    artifact_path = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\phase2_background_verified.png"
    workspace_path = r"C:\Users\user\Desktop\zort\phase2_background_verified.png"
    raw_b64 = shot_data.get("result", {}).get("data") or shot_data.get("data")
    if raw_b64:
        b_data = base64.b64decode(raw_b64)
        with open(artifact_path, "wb") as f:
            f.write(b_data)
        with open(workspace_path, "wb") as f:
            f.write(b_data)
        print(f"[+] Phase 2 verified screenshot saved to:\n  - {artifact_path}\n  - {workspace_path}")

    # Check console errors and warnings
    errs = ws.eval("window.__perfErrors || []")
    warns = ws.eval("window.__perfWarnings || []")
    print(f"[*] Console error count: {len(errs)}, warning count: {len(warns)}")
    if errs:
        print(f"[!] Errors detected: {errs}")
    if warns:
        print(f"[!] Warnings detected: {warns}")

    assert len(errs) == 0, f"Errors: {errs}"
    assert nebula_info is not None, "NebulaManager missing!"
    assert nebula_info["isInitialized"] is True, "NebulaManager not initialized!"
    assert nebula_info["spriteVisible"] is True, "Nebula sprite not visible!"
    assert nebula_info["filterResolution"] == 0.5, f"Nebula not rendered at half resolution! (res={nebula_info['filterResolution']})"
    assert movement_info["warpStarCount"] >= 50, "Warpable stars missing!"
    assert movement_info["asteroidCount"] >= 10, "Asteroids missing!"
    assert movement_info["maxWarpStretch"] > 1.2, f"Warp stars did not stretch on movement! (maxStretch={movement_info['maxWarpStretch']})"
    assert dash_info["maxDashStretch"] > movement_info["maxWarpStretch"], "Dash did not surge warp streaks!"
    print("[+] PHASE 2 VERIFICATION COMPLETE: ALL CHECKS PASSED WITH 0 ERRORS!")

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
    print("[*] Cleanup finished.")
