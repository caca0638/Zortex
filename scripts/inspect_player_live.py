import urllib.request
import json
import time
import sys
import os
import subprocess

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8219
DEBUG_PORT = 9449
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_inspect_{int(time.time())}"

# os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
time.sleep(0.5)

app_proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--directory", r"C:\Users\user\Desktop\zort"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)

browser = find_browser()
browser_proc = subprocess.Popen([
    browser, f"--remote-debugging-port={DEBUG_PORT}", f"--user-data-dir={USER_DATA}",
    "--window-size=1280,720", "--headless=new", "--use-gl=angle", "--enable-webgl", "--enable-webgl2",
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

    res = ws.eval("""
    (() => {
        const p = window.player;
        const sp = p ? p.sprite : null;
        const bodyCont = window.pixiShipBodyContainer;
        const pCont = window.pixiPlayerContainer;
        return {
            playerExists: !!p,
            playerClass: p ? p.shipClassId : null,
            playerPos: p ? { x: p.x, y: p.y } : null,
            spriteExists: !!sp,
            spriteVisible: sp ? sp.visible : null,
            spriteAlpha: sp ? sp.alpha : null,
            spritePos: sp ? { x: sp.x, y: sp.y } : null,
            spriteScale: sp ? { x: sp.scale.x, y: sp.scale.y } : null,
            spriteBounds: sp ? { w: sp.width, h: sp.height } : null,
            spriteParent: sp && sp.parent ? (sp.parent.label || sp.parent.constructor.name) : null,
            bodyContExists: !!bodyCont,
            bodyContParent: bodyCont && bodyCont.parent ? bodyCont.parent.constructor.name : null,
            bodyContFilters: bodyCont && bodyCont.filters ? bodyCont.filters.map(f => f.constructor.name) : null,
            pContChildren: pCont ? pCont.children.map(c => c.label || c.constructor.name) : null,
            bubbleExists: !!(p && p.shieldBubbleSprite),
            bubbleVisible: p && p.shieldBubbleSprite ? p.shieldBubbleSprite.visible : null,
            bubbleAlpha: p && p.shieldBubbleSprite ? p.shieldBubbleSprite.alpha : null,
            bubbleBounds: p && p.shieldBubbleSprite ? { w: p.shieldBubbleSprite.width, h: p.shieldBubbleSprite.height } : null,
            ringExists: !!(p && p.shieldSprite),
            ringVisible: p && p.shieldSprite ? p.shieldSprite.visible : null,
            ringAlpha: p && p.shieldSprite ? p.shieldSprite.alpha : null,
        };
    })()
    """)
    print("INSPECTION RESULT:", json.dumps(res, indent=2))
finally:
    browser_proc.kill()
    app_proc.kill()
