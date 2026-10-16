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

PORT = 8110
DEBUG_PORT = 9340
USER_DATA = r"C:\Users\user\Desktop\zort\.app_profile_phase0"

# os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
time.sleep(0.5)

print(f"[*] Starting HTTP server on port {PORT}...")
app_proc = subprocess.Popen([
    "python", "-m", "http.server", str(PORT), "--directory", r"C:\Users\user\Desktop\zort"
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
    f"http://127.0.0.1:{PORT}/index.html"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(3.0)

try:
    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json") as r:
        targets = json.loads(r.read())
    page = next((t for t in targets if t.get("type") == "page" and str(PORT) in t.get("url", "")), targets[0])
    ws = MinimalWebSocket(page["webSocketDebuggerUrl"])
    ws.call("Runtime.enable")
    ws.call("Page.enable")

    print("[*] Initializing Phase 0 verification...")
    ws.eval("""
    window.__perfErrors = [];
    window.onerror = function(msg, src, lin, col, err) {
        window.__perfErrors.push(String(msg) + ' at ' + lin + ':' + col);
    };

    selectProfile('Ajan Alpha');
    startGame();
    player.godMode = true;
    """)

    time.sleep(3.0)

    # Check ZortexFX Status and libraries
    check_res = ws.eval("""
    (() => {
        return {
            hasZortexFX: !!window.ZortexFX,
            tier: window.ZortexFX ? window.ZortexFX.quality.currentTier : null,
            hasTweakpane: !!(window.Tweakpane && window.Tweakpane.Pane),
            hasPixiFilters: !!window.PIXI_FILTERS,
            hasAdvancedBloom: !!(window.PIXI_FILTERS && window.PIXI_FILTERS.AdvancedBloomFilter),
            hasRGBSplit: !!(window.PIXI_FILTERS && window.PIXI_FILTERS.RGBSplitFilter),
            hasShockwave: !!(window.PIXI_FILTERS && window.PIXI_FILTERS.ShockwaveFilter),
            hudText: document.getElementById('zortex-fx-stats') ? document.getElementById('zortex-fx-stats').innerText : null,
            fps: window.fpsSmoothed || 0,
            enemies: (window.enemies || []).length,
            bullets: (window.bullets || []).length,
            particles: (window.particles && window.particles.activeCount) || 0
        };
    })()
    """)
    print("[*] Architecture & FX Check:", json.dumps(check_res, indent=2))

    # Test F2 Tweakpane toggle
    print("[*] Testing Tweakpane F2 toggle...")
    ws.eval("""
    (() => {
        window.ZortexFX.debug.toggleTweakpane();
    })()
    """)
    time.sleep(1.0)
    tweakpane_status = ws.eval("""
    (() => {
        return {
            isVisible: window.ZortexFX && window.ZortexFX.debug.isVisible,
            paneExists: !!(window.ZortexFX && window.ZortexFX.debug.pane)
        };
    })()
    """)
    print("[*] Tweakpane Status:", json.dumps(tweakpane_status, indent=2))

    # Measure FPS in combat for 3 seconds
    fps_samples = []
    for _ in range(6):
        time.sleep(0.5)
        cur_fps = ws.eval("window.fpsSmoothed || 0")
        if cur_fps:
            fps_samples.append(cur_fps)

    avg_fps = sum(fps_samples) / max(1, len(fps_samples))
    print(f"[*] Average Combat FPS: {avg_fps:.1f} (Samples: {fps_samples})")

    # Capture Phase 0 Screenshot
    shot_data = ws.call("Page.captureScreenshot", {"format": "png"})
    out_path = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\phase0_infra_verified.png"
    if "result" in shot_data and "data" in shot_data["result"]:
        raw_b64 = shot_data["result"]["data"]
    elif "data" in shot_data:
        raw_b64 = shot_data["data"]
    else:
        raw_b64 = None

    if raw_b64:
        with open(out_path, "wb") as f:
            f.write(base64.b64decode(raw_b64))
        print(f"[+] Verified screenshot saved to {out_path}")
    else:
        print(f"[!] Warning: screenshot payload missing data: {shot_data.keys()}")

    # Check for console errors
    errs = ws.eval("window.__perfErrors || []")
    print(f"[*] Console error count: {len(errs)}")
    if errs:
        print(f"[!] Errors: {errs}")
    assert len(errs) == 0, f"Errors encountered: {errs}"

finally:
    try:
        browser_proc.kill()
    except:
        pass
    try:
        app_proc.kill()
    except:
        pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
    print("[*] Test clean-up completed.")
