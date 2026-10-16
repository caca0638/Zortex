import urllib.request
import json
import time
import sys
import os
import subprocess

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8243
DEBUG_PORT = 9473
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_ugroup_{int(time.time())}"

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

    res = ws.eval("""
    (() => {
        return {
            hasUniformGroup: typeof PIXI.UniformGroup === 'function',
            filterProtoKeys: Object.getOwnPropertyNames(PIXI.Filter.prototype),
            customFilterExample: (() => {
                try {
                    const ug = new PIXI.UniformGroup({
                        uGlowColor: { value: new Float32Array([0.0, 0.95, 1.0]), type: 'vec3<f32>' },
                        uGlowIntensity: { value: 1.2, type: 'f32' },
                        uTime: { value: 0.0, type: 'f32' }
                    });
                    return { ugCreated: !!ug };
                } catch (e) {
                    return { ugError: e.message };
                }
            })()
        };
    })()
    """)
    print("UGROUP TEST:", json.dumps(res, indent=2))
finally:
    browser_proc.kill()
    app_proc.kill()
