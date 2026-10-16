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

PORT = 8175
DEBUG_PORT = 9405
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_phase1_{int(time.time())}"

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

    print("[*] Waiting for PixiJS and renderer initialization...")
    is_ready = False
    for i in range(30):
        check = ws.eval("""
        (() => {
            return {
                pixiReady: typeof PIXI !== 'undefined' && !!window.pixiApp && !!window.pixiApp.renderer && !!window.worldContainer,
                texturesReady: typeof pixiTextures !== 'undefined' && !!pixiTextures && !!pixiTextures.ship_interceptor,
                gameReady: typeof startGame === 'function' && typeof selectProfile === 'function'
            };
        })()
        """)
        if check and check.get("pixiReady") and check.get("texturesReady") and check.get("gameReady"):
            print(f"[+] Pixi and Game fully ready at iteration {i}!")
            is_ready = True
            break
        time.sleep(0.3)

    assert is_ready, "Game failed to initialize within timeout!"

    print("[*] Starting game and setting up Phase 1 visual combat scenario...")
    ws.eval("""
    window.__perfErrors = [];
    window.onerror = function(msg, src, lin, col, err) {
        window.__perfErrors.push(String(msg) + ' at ' + lin + ':' + col);
    };

    selectProfile('Ajan Alpha');
    startGame();
    player.godMode = true;
    player.nextLevelXp = 999999999;
    const ov = document.getElementById('upgradeOverlay');
    if (ov) ov.classList.add('hidden');

    // Enable Gatling Laser and continuous firing for bloom evaluation
    player.hasGatlingLaser = true;
    autoFire = true;
    mouse.down = true;

    // Spawn combat enemies in circle for visual contrast
    for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        const dist = 220 + (i % 3) * 40;
        const ex = player.x + Math.cos(ang) * dist;
        const ey = player.y + Math.sin(ang) * dist;
        const eType = (i % 4 === 0) ? 'heavy' : ((i % 3 === 0) ? 'fast' : 'scout');
        const e = new Enemy(ex, ey, eType);
        enemies.push(e);
    }
    """)

    time.sleep(2.5)

    # Layer & Bloom inspection
    layer_info = ws.eval("""
    (() => {
        const emissive = window.pixiEmissiveLayer;
        const bg = window.pixiBackgroundLayer;
        const ent = window.pixiEntitiesLayer;
        const bloomMgr = window.ZortexFX ? window.ZortexFX.bloom : null;

        return {
            hasBackgroundLayer: !!bg,
            hasEntitiesLayer: !!ent,
            hasEmissiveLayer: !!emissive,
            emissiveFiltersCount: emissive && emissive.filters ? emissive.filters.length : 0,
            emissiveFilterName: emissive && emissive.filters && emissive.filters[0] ? emissive.filters[0].constructor.name : null,
            bgFiltersCount: bg && bg.filters ? bg.filters.length : 0,
            bloomInitialized: bloomMgr ? bloomMgr.isInitialized : false,
            bloomThreshold: bloomMgr && bloomMgr.filter ? bloomMgr.filter.threshold : null,
            bloomScale: bloomMgr && bloomMgr.filter ? bloomMgr.filter.bloomScale : null,
            bloomResolution: bloomMgr && bloomMgr.filter ? bloomMgr.filter.resolution : null,
            enemyCount: enemies.length,
            bulletCount: bullets.length,
            playerVisible: player.sprite ? player.sprite.visible : false
        };
    })()
    """)
    print("[*] Layer & Bloom Architecture Verification:\n", json.dumps(layer_info, indent=2))

    # Measure FPS in active bloom combat
    fps_samples = []
    for _ in range(10):
        time.sleep(0.3)
        cur_fps = ws.eval("window.fpsSmoothed || 0")
        if cur_fps:
            fps_samples.append(cur_fps)

    avg_fps = sum(fps_samples) / max(1, len(fps_samples))
    min_fps = min(fps_samples) if fps_samples else 0
    print(f"[*] Average Combat FPS: {avg_fps:.1f} FPS (Min: {min_fps} FPS, Samples: {fps_samples})")

    # Capture Phase 1 Verified Screenshot
    shot_data = ws.call("Page.captureScreenshot", {"format": "png"})
    out_path = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\phase1_selective_bloom_verified.png"
    raw_b64 = shot_data.get("result", {}).get("data") or shot_data.get("data")
    if raw_b64:
        with open(out_path, "wb") as f:
            f.write(base64.b64decode(raw_b64))
        print(f"[+] Phase 1 verified screenshot saved to {out_path}")

    # Check console errors
    errs = ws.eval("window.__perfErrors || []")
    print(f"[*] Console error count: {len(errs)}")
    if errs:
        print(f"[!] Errors detected: {errs}")
    assert len(errs) == 0, f"Errors: {errs}"
    assert layer_info["hasEmissiveLayer"] is True, "emissiveLayer missing!"
    assert layer_info["emissiveFiltersCount"] >= 1, "Bloom filter not attached to emissiveLayer!"
    assert layer_info["bgFiltersCount"] == 0, "Background layer erroneously filtered!"
    assert layer_info["playerVisible"] is True, "Player sprite not visible!"
    print("[+] PHASE 1 VERIFICATION COMPLETE: ALL CHECKS PASSED!")

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
    print("[*] Cleanup finished.")
