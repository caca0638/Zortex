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

PORT = 8183
DEBUG_PORT = 9413
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_phase3_{int(time.time())}"

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

    print("[*] Waiting for PixiJS, MeshRope Trails and Explosions initialization...")
    is_ready = False
    for i in range(30):
        check = ws.eval("""
        (() => {
            return {
                pixiReady: typeof PIXI !== 'undefined' && !!window.pixiApp && !!window.pixiApp.renderer && !!window.worldContainer,
                texturesReady: typeof pixiTextures !== 'undefined' && !!pixiTextures && !!pixiTextures.trail_ribbon && !!pixiTextures.light_scorch,
                trailsReady: !!window.ZortexFX && !!window.ZortexFX.trails && window.ZortexFX.trails.isInitialized,
                explosionsReady: !!window.ZortexFX && !!window.ZortexFX.explosions && window.ZortexFX.explosions.isInitialized,
                gameReady: typeof startGame === 'function' && typeof selectProfile === 'function'
            };
        })()
        """)
        if check and check.get("pixiReady") and check.get("texturesReady") and check.get("trailsReady") and check.get("explosionsReady") and check.get("gameReady"):
            print(f"[+] All Phase 3 systems ready at iteration {i}: {check}")
            is_ready = True
            break
        time.sleep(0.3)

    assert is_ready, "Game / Phase 3 systems failed to initialize within timeout!"

    print("[*] Starting game and establishing Phase 3 combat scenario...")
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

    // Enable high-speed Railgun and Gatling Laser
    player.activeWeaponId = 'railgun';
    autoFire = true;
    mouse.down = true;

    // Spawn 12 enemies (normal, elite, heavy) in front of player
    for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const dist = 200 + (i % 3) * 40;
        const ex = player.x + Math.cos(ang) * dist;
        const ey = player.y + Math.sin(ang) * dist;
        const eType = (i === 0) ? 'heavy' : ((i % 3 === 0) ? 'shooter' : 'scout');
        const e = new Enemy(ex, ey, eType);
        if (i % 4 === 0) e.isElite = true;
        enemies.push(e);
    }
    """)

    time.sleep(1.0)

    print("[*] Simulating movement and firing to verify MeshRope Trails...")
    # Move and dash player to exercise player MeshRope ribbon
    ws.eval("""
    keys['KeyW'] = true;
    keys['KeyA'] = true;
    player.dash();
    """)
    time.sleep(0.8)

    trails_info = ws.eval("""
    (() => {
        const trails = window.ZortexFX ? window.ZortexFX.trails : null;
        if (!trails) return null;
        let activeBulletRopes = 0;
        if (trails.bulletRopes) {
            for (let br of trails.bulletRopes) {
                if (br.rope && br.rope.visible && br.rope.alpha > 0) activeBulletRopes++;
            }
        }
        return {
            isInitialized: trails.isInitialized,
            playerRopeExists: !!trails.playerRope,
            playerRopeAlpha: trails.playerRope ? trails.playerRope.alpha : 0,
            playerRopeWidth: trails.playerRope && trails.playerRope.geometry ? trails.playerRope.geometry._width : 0,
            playerPointsCount: trails.playerPoints ? trails.playerPoints.length : 0,
            bulletRopesTotal: trails.bulletRopes ? trails.bulletRopes.length : 0,
            activeBulletRopes: activeBulletRopes,
            bulletsCount: bullets.length
        };
    })()
    """)
    print("[*] MeshRope Trails Verification:\n", json.dumps(trails_info, indent=2))

    # Release movement keys
    ws.eval("keys['KeyW'] = false; keys['KeyA'] = false;")

    # Test 3-Tier Explosions
    print("[*] Triggering 3-tier explosions (Normal, Elite, Boss)...")
    ws.eval("""
    // Normal Tier 1 Explosion
    window.ZortexFX.triggerExplosion(player.x + 120, player.y - 80, '#00f3ff', 1);
    // Elite Tier 2 Explosion
    window.ZortexFX.triggerExplosion(player.x - 140, player.y - 60, '#ffd700', 2);
    // Boss Tier 3 Explosion
    window.ZortexFX.triggerExplosion(player.x, player.y + 160, '#ff0055', 3);
    """)
    time.sleep(0.6)

    explosion_info = ws.eval("""
    (() => {
        const expMgr = window.ZortexFX ? window.ZortexFX.explosions : null;
        if (!expMgr) return null;
        let activeSpots = 0;
        for (let s of expMgr.lightSpots) {
            if (s.active) activeSpots++;
        }
        return {
            isInitialized: expMgr.isInitialized,
            totalLightSpots: expMgr.lightSpots.length,
            activeLightSpots: activeSpots,
            shockwavesCount: shockwaves.length,
            particlesCount: particles.activeCount
        };
    })()
    """)
    print("[*] 3-Tier Explosion System Verification:\n", json.dumps(explosion_info, indent=2))

    # Kill remaining enemies to test in-combat explosions
    ws.eval("""
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].hp = 0;
        enemies[i].die();
    }
    enemies = [];
    """)
    time.sleep(0.5)

    # Measure FPS
    fps_samples = []
    for _ in range(10):
        time.sleep(0.3)
        cur_fps = ws.eval("window.ZortexFX && window.ZortexFX.metrics ? window.ZortexFX.metrics.fps : (window.fpsSmoothed || 0)")
        if cur_fps:
            fps_samples.append(cur_fps)

    avg_fps = sum(fps_samples) / max(1, len(fps_samples))
    min_fps = min(fps_samples) if fps_samples else 0
    print(f"[*] Average Phase 3 Combat FPS: {avg_fps:.1f} FPS (Min: {min_fps} FPS, Samples: {fps_samples})")

    # Capture Phase 3 Verified Screenshot
    shot_data = ws.call("Page.captureScreenshot", {"format": "png"})
    artifact_path = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\phase3_particles_trails_verified.png"
    workspace_path = r"C:\Users\user\Desktop\zort\phase3_particles_trails_verified.png"
    raw_b64 = shot_data.get("result", {}).get("data") or shot_data.get("data")
    if raw_b64:
        b_data = base64.b64decode(raw_b64)
        with open(artifact_path, "wb") as f:
            f.write(b_data)
        with open(workspace_path, "wb") as f:
            f.write(b_data)
        print(f"[+] Phase 3 verified screenshot saved to:\n  - {artifact_path}\n  - {workspace_path}")

    # Check console errors and warnings
    errs = ws.eval("window.__perfErrors || []")
    warns = ws.eval("window.__perfWarnings || []")
    print(f"[*] Console error count: {len(errs)}, warning count: {len(warns)}")
    if errs:
        print(f"[!] Errors detected: {errs}")
    if warns:
        print(f"[!] Warnings detected: {warns}")

    assert len(errs) == 0, f"Errors: {errs}"
    assert trails_info is not None, "TrailFXManager missing!"
    assert trails_info["isInitialized"] is True, "TrailFXManager not initialized!"
    assert trails_info["playerRopeExists"] is True, "playerRope missing!"
    assert trails_info["playerPointsCount"] >= 16, "playerRope points count too low!"
    assert trails_info["bulletRopesTotal"] == 16, "bulletRopes pool not size 16!"
    assert explosion_info is not None, "ExplosionFXManager missing!"
    assert explosion_info["isInitialized"] is True, "ExplosionFXManager not initialized!"
    assert explosion_info["totalLightSpots"] == 24, "lightSpots pool not size 24!"
    assert explosion_info["particlesCount"] > 0, "Particles not emitted!"
    print("[+] PHASE 3 VERIFICATION COMPLETE: ALL CHECKS PASSED WITH 0 ERRORS!")

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
    print("[*] Cleanup finished.")
