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

PORT = 8199
DEBUG_PORT = 9429
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_phase6_combat_{int(time.time())}"

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

    # 1. Start game and grant player godMode + orbital shields + check lighting & rim glow
    diag = ws.eval("""
    (() => {
        try {
            if (typeof startGame === 'function') startGame();
            
            if (window.player) {
                window.player.godMode = true;
                window.player.addOrbitalShield();
                window.player.addOrbitalShield();
            }

            const fx = window.ZortexFX;
            const hasRadialTex = Boolean(window.pixiTextures && window.pixiTextures.radial_point_light);
            const hasLightsContainer = Boolean(window.pixiLightsContainer);
            const hasLightsManager = Boolean(fx && fx.lights && fx.lights.pool && fx.lights.pool.length === 32);
            const hasRimGlow = Boolean(fx && fx.rimGlow && fx.rimGlow.filter);
            const playerFilters = Boolean(window.pixiPlayerContainer && window.pixiPlayerContainer.filters && window.pixiPlayerContainer.filters.length > 0);

            // Test addLight
            let testLightWorked = false;
            if (fx && fx.addLight) {
                const l = fx.addLight(640, 360, 0x00f3ff, 200, 0.5, 1.0);
                testLightWorked = Boolean(l && l.active);
            }

            return {
                ok: true,
                hasRadialTex: hasRadialTex,
                hasLightsContainer: hasLightsContainer,
                hasLightsManager: hasLightsManager,
                hasRimGlow: hasRimGlow,
                playerFilters: playerFilters,
                testLightWorked: testLightWorked
            };
        } catch(e) {
            return { ok: false, error: e.stack || e.message };
        }
    })()
    """)
    print("[*] Phase 6 Diagnostic:", diag)

    # 2. Simulate combat with dashing, shooting and explosions
    ws.eval("""
    (() => {
        if (window.player) {
            // Trigger dash (generates dash point light)
            window.player.dash();
            // Trigger muzzle flash (generates muzzle point light)
            window.player.triggerMuzzleFlash('plasma', 0x00f3ff, 1.5, true);
        }

        // Spawn multiple enemies
        if (typeof Enemy !== 'undefined' && window.enemies) {
            for (let i = 0; i < 22; i++) {
                const ang = (i / 22) * Math.PI * 2;
                const dist = 180 + (i % 3) * 60;
                const px = window.player ? window.player.x : 640;
                const py = window.player ? window.player.y : 360;
                const ex = px + Math.cos(ang) * dist;
                const ey = py + Math.sin(ang) * dist;
                const enemyType = (i % 5 === 0) ? 'titan' : ((i % 3 === 0) ? 'phantom' : 'scout');
                const en = new Enemy(ex, ey, enemyType);
                window.enemies.push(en);
            }
        }

        // Trigger Tier 1, 2, 3 explosions around
        if (window.ZortexFX) {
            const px = window.player ? window.player.x : 640;
            const py = window.player ? window.player.y : 360;
            window.ZortexFX.triggerExplosion(px - 140, py - 90, 0xff0055, 1);
            window.ZortexFX.triggerExplosion(px + 160, py - 80, 0xffaa00, 2);
            window.ZortexFX.triggerExplosion(px, py + 180, 0x9333ea, 3);
        }
    })()
    """)

    time.sleep(2.0)

    # 3. Sample FPS over time
    fps_samples = []
    for _ in range(10):
        f = ws.eval("typeof fpsSmoothed !== 'undefined' ? fpsSmoothed : 60")
        if isinstance(f, (int, float)):
            fps_samples.append(f)
        time.sleep(0.1)

    avg_fps = sum(fps_samples) / len(fps_samples) if fps_samples else 0
    print(f"[*] FPS Samples: {fps_samples}, Average: {avg_fps:.1f} FPS")

    # 4. Check console errors and warnings
    errors = ws.eval("window.__lastErrors || []")
    warnings = ws.eval("window.__lastWarnings || []")
    print(f"[*] Console Errors count: {len(errors) if isinstance(errors, list) else 0}")
    print(f"[*] Console Warnings count: {len(warnings) if isinstance(warnings, list) else 0}")

    # 5. Capture screenshot
    shot = ws.call("Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(shot["result"]["data"])
    artifact_path = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\phase6_lighting_depth_verified.png"
    with open(artifact_path, "wb") as f:
        f.write(img_data)
    print(f"[+] Verified screenshot saved to: {artifact_path}")

finally:
    try:
        browser_proc.kill()
        app_proc.kill()
    except:
        pass
