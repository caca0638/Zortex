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

PORT = 8193
DEBUG_PORT = 9423
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_phase4_{int(time.time())}"

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

    # 1. Check Console Logs
    logs = ws.call("Runtime.evaluate", {
        "expression": "window.__capturedConsoleLogs || []",
        "returnByValue": True
    })

    # 2. Inspect PostProcessFXManager and Filter state
    diag = ws.eval("""
    (() => {
        try {
            const zfx = window.ZortexFX;
            const pp = zfx ? zfx.postProcess : null;
            const wc = window.worldContainer;
            const filtersCount = (wc && wc.filters) ? wc.filters.length : 0;
            const hasUnified = Boolean(pp && pp.unifiedFilter && wc && wc.filters && wc.filters.includes(pp.unifiedFilter));
            
            // Test damage aberration
            zfx.triggerDamageAberration(1.2);
            const rgbActive = Boolean(pp.rgbSplitTimer > 0 && wc.filters.includes(pp.rgbSplitFilter));
            
            // Test shockwave
            zfx.triggerShockwave(640, 360, 350, 0.5);
            const swActive = Boolean(pp.activeShockwaves.length > 0);
            
            return {
                ok: true,
                zfxReady: !!zfx,
                ppReady: !!pp,
                hasUnified: hasUnified,
                rgbActive: rgbActive,
                swActive: swActive,
                initialFilterCount: filtersCount
            };
        } catch(e) {
            return { ok: false, error: e.stack || e.message };
        }
    })()
    """)
    print("[*] Diagnostic state:", diag)

    # 3. Start game and play combat for 3 seconds
    ws.eval("if (typeof startGame === 'function') startGame();")
    time.sleep(2.0)

    # Trigger some combat events: damage, dash, shockwave
    ws.eval("""
    (() => {
        if (window.player) {
            window.player.takeDamage(15);
            window.player.isDashing = true;
            window.player.dashAngle = 0.5;
            window.triggerCameraZoom(0.04);
        }
    })()
    """)
    time.sleep(1.0)

    # 4. Measure FPS
    fps_res = ws.eval("""
    (() => {
        return new Promise((resolve) => {
            const samples = [];
            let last = performance.now();
            let count = 0;
            function measure() {
                const now = performance.now();
                const delta = now - last;
                last = now;
                if (delta > 0) samples.push(1000 / delta);
                count++;
                if (count < 60) {
                    requestAnimationFrame(measure);
                } else {
                    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
                    const min = Math.min(...samples);
                    const max = Math.max(...samples);
                    resolve({ avg: Math.round(avg * 10) / 10, min: Math.round(min), max: Math.round(max), samplesCount: samples.length });
                }
            }
            requestAnimationFrame(measure);
        });
    })()
    """)
    print("[*] FPS Measurement:", fps_res)

    # 5. Check filters after transients have expired
    transients_expired = ws.eval("""
    (() => {
        const pp = window.ZortexFX ? window.ZortexFX.postProcess : null;
        const wc = window.worldContainer;
        return {
            rgbTimer: pp ? pp.rgbSplitTimer : -1,
            shockwavesCount: pp ? pp.activeShockwaves.length : -1,
            filtersOnWorldContainer: (wc && wc.filters) ? wc.filters.length : 0
        };
    })()
    """)
    print("[*] Post-transient cleanup check:", transients_expired)

    # 6. Capture screenshot
    shot = ws.call("Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(shot["result"]["data"])
    
    out_dir = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950"
    out_path = os.path.join(out_dir, "phase4_juice_postprocess_verified.png")
    with open(out_path, "wb") as f:
        f.write(img_data)
    print(f"[*] Screenshot saved to: {out_path} ({len(img_data)} bytes)")

    # Local workspace copy
    with open(r"C:\Users\user\Desktop\zort\phase4_juice_postprocess_verified.png", "wb") as f:
        f.write(img_data)

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
