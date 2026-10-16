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

PORT = 8202
DEBUG_PORT = 9432
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_item2_{int(time.time())}"

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

try:
    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json") as r:
        targets = json.loads(r.read())
    page = next((t for t in targets if str(PORT) in t.get("url", "") and t.get("type") == "page"), targets[0])
    ws = MinimalWebSocket(page["webSocketDebuggerUrl"])
    ws.call("Runtime.enable")

    # Start game so weapon HUD is displayed and score is visible
    ws.eval("if (typeof startGame === 'function') startGame();")
    time.sleep(1.0)
    
    # Also evaluate bounding rects of #top-controls and .hud-top-right and .weapon-hud-key
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
                overflowY: parentR.top - r.top
            };
        });
        
        return {
            topControls: { top: topControls.top, bottom: topControls.bottom, left: topControls.left, right: topControls.right },
            hudTopRight: { top: hudTopRight.top, bottom: hudTopRight.bottom, left: hudTopRight.left, right: hudTopRight.right },
            scoreText: { top: scoreText.top, bottom: scoreText.bottom, left: scoreText.left, right: scoreText.right },
            overlapScoreWithControls: !(topControls.right < scoreText.left || topControls.left > scoreText.right || topControls.bottom < scoreText.top || topControls.top > scoreText.bottom),
            weaponKeys: weaponKeys
        };
    })()
    """)
    print("DIAGNOSTIC DATA:", json.dumps(diag, indent=2))

    res = ws.call("Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(res["result"]["data"])
    path = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\item2_before.png"
    with open(path, "wb") as f:
        f.write(img_data)
    print("Item 2 BEFORE captured:", path)
finally:
    try:
        browser_proc.kill()
        app_proc.kill()
    except:
        pass
