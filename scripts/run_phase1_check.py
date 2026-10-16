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

PORT = 8130
DEBUG_PORT = 9360
USER_DATA = r"C:\Users\user\Desktop\zort\.app_profile_phase1_test"

# os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
time.sleep(0.5)

py_exe = sys.executable
print(f"[*] Starting HTTP server using {py_exe} on port {PORT}...")
app_proc = subprocess.Popen([
    py_exe, "-m", "http.server", str(PORT), "--directory", r"C:\Users\user\Desktop\zort"
])
time.sleep(2.0)

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
    f"http://127.0.0.1:{PORT}/index.html"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(3.5)

try:
    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json") as r:
        targets = json.loads(r.read())
    
    page = next((t for t in targets if str(PORT) in t.get("url", "") and t.get("type") == "page"), None)
    if not page:
        page = next(t for t in targets if t.get("type") == "page")
    print(f"[*] Attached to target URL: {page.get('url')}")

    ws = MinimalWebSocket(page["webSocketDebuggerUrl"])
    ws.call("Runtime.enable")
    ws.call("Page.enable")

    # Wait for game to initialize
    print("[*] Waiting for game to load...")
    for _ in range(25):
        ready = ws.eval("typeof startGame === 'function' && typeof selectProfile === 'function'")
        if ready:
            break
        time.sleep(0.4)

    print("[*] Initializing Phase 1 verification (Layered Scene & Selective Bloom)...")
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

    // Activate Gatling Laser for visual bloom check
    player.hasGatlingLaser = true;
    player.isGatlingActive = true;
    player.gatlingStartX = player.x;
    player.gatlingStartY = player.y;
    player.gatlingEndX = player.x + 400;
    player.gatlingEndY = player.y - 300;
    player.gatlingBeams = [
        { startX: player.x, startY: player.y, endX: player.x + 420, endY: player.y - 320 },
        { startX: player.x, startY: player.y, endX: player.x + 400, endY: player.y - 300 },
        { startX: player.x, startY: player.y, endX: player.x + 380, endY: player.y - 280 }
    ];
    """)

    time.sleep(3.0)

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
            bloomResolution: bloomMgr && bloomMgr.filter ? bloomMgr.filter.resolution : null
        };
    })()
    """)
    print("[*] Layer & Bloom Architecture Verification:", json.dumps(layer_info, indent=2))

    # Measure FPS in active bloom combat
    fps_samples = []
    for _ in range(8):
        time.sleep(0.4)
        cur_fps = ws.eval("window.fpsSmoothed || 0")
        if cur_fps:
            fps_samples.append(cur_fps)

    avg_fps = sum(fps_samples) / max(1, len(fps_samples))
    min_fps = min(fps_samples) if fps_samples else 0
    print(f"[*] Average Combat FPS: {avg_fps:.1f} FPS (Min: {min_fps} FPS, Samples: {fps_samples})")

    # Capture Phase 1 Screenshot
    shot_data = ws.call("Page.captureScreenshot", {"format": "png"})
    out_path = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\phase1_selective_bloom_verified.png"
    if "result" in shot_data and "data" in shot_data["result"]:
        raw_b64 = shot_data["result"]["data"]
    elif "data" in shot_data:
        raw_b64 = shot_data["data"]
    else:
        raw_b64 = None

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
    print("[+] PHASE 1 VERIFICATION COMPLETE: ALL CHECKS PASSED!")

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
    print("[*] Cleanup finished.")
