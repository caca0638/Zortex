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

PORT = 8203
DEBUG_PORT = 9433

resolutions = [
    (1280, 720, "item2_after_720p"),
    (1366, 768, "item2_after_768p"),
    (1920, 1080, "item2_after_1080p")
]

py_exe = sys.executable

for width, height, name in resolutions:
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
    time.sleep(0.5)

    user_data = rf"C:\Users\user\Desktop\zort\.app_profile_item2_{width}_{int(time.time())}"
    app_proc = subprocess.Popen([
        py_exe, "-m", "http.server", str(PORT), "--directory", r"C:\Users\user\Desktop\zort"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)

    browser = find_browser()
    browser_proc = subprocess.Popen([
        browser,
        f"--remote-debugging-port={DEBUG_PORT}",
        f"--user-data-dir={user_data}",
        f"--window-size={width},{height}",
        "--headless=new",
        "--use-gl=angle",
        "--enable-webgl",
        "--enable-webgl2",
        f"http://127.0.0.1:{PORT}/index.html"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2.5)

    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json") as r:
            targets = json.loads(r.read())
        page = next((t for t in targets if str(PORT) in t.get("url", "") and t.get("type") == "page"), targets[0])
        ws = MinimalWebSocket(page["webSocketDebuggerUrl"])
        ws.call("Runtime.enable")

        ws.eval("if (typeof startGame === 'function') startGame();")
        time.sleep(1.0)

        diag = ws.eval("""
        (() => {
            const topControls = document.getElementById('top-controls').getBoundingClientRect();
            const hudTopRight = document.querySelector('.hud-top-right').getBoundingClientRect();
            const scoreText = document.getElementById('hudScoreText').getBoundingClientRect();
            const weaponKeys = Array.from(document.querySelectorAll('.weapon-hud-key')).map(el => {
                const r = el.getBoundingClientRect();
                const parentR = el.parentElement.getBoundingClientRect();
                return {
                    key: el.textContent,
                    top: r.top,
                    bottom: r.bottom,
                    parentTop: parentR.top,
                    overflowY: parentR.top - r.top,
                    visibleHeight: r.height
                };
            });
            
            // Overlap check between controls and score text
            const overlapScoreWithControls = !(topControls.right < scoreText.left || topControls.left > scoreText.right || topControls.bottom < scoreText.top || topControls.top > scoreText.bottom);
            
            return {
                resolution: window.innerWidth + 'x' + window.innerHeight,
                topControls: { top: topControls.top, bottom: topControls.bottom, left: topControls.left, right: topControls.right },
                scoreText: { top: scoreText.top, bottom: scoreText.bottom, left: scoreText.left, right: scoreText.right },
                overlapScoreWithControls: overlapScoreWithControls,
                weaponKeys: weaponKeys,
                errors: window.__lastErrors || [],
                warnings: window.__lastWarnings || []
            };
        })()
        """)
        print(f"[{width}x{height}] DIAGNOSTIC DATA:", json.dumps(diag, indent=2))

        res = ws.call("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(res["result"]["data"])
        out_dir = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950"
        path = os.path.join(out_dir, f"{name}.png")
        with open(path, "wb") as f:
            f.write(img_data)
        print(f"[{width}x{height}] Screenshot saved: {name}.png")

    finally:
        try:
            browser_proc.kill()
            app_proc.kill()
        except:
            pass

print("ALL RESOLUTION TESTS COMPLETED.")
