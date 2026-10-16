import urllib.request
import json
import subprocess
import time
import sys
import os

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8190
DEBUG_PORT = 9420
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_test_shader_{int(time.time())}"

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
    time.sleep(1.0)

    # Test Pixi v8 Filter rendering
    res = ws.eval("""
    (() => {
        try {
            const vert = `
                in vec2 aPosition;
                out vec2 vTextureCoord;
                uniform vec4 uInputSize;
                uniform vec4 uOutputFrame;
                uniform vec4 uOutputTexture;

                void main(void) {
                    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
                    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
                    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
                    gl_Position = vec4(position, 0.0, 1.0);
                    vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
                }
            `;
            const frag = `
                precision highp float;
                in vec2 vTextureCoord;
                out vec4 finalColor;
                uniform float uTime;
                uniform vec3 uColorA;
                uniform vec3 uColorB;

                void main(void) {
                    finalColor = vec4(uColorA, 0.5);
                }
            `;

            const glProgram = PIXI.GlProgram.from({
                vertex: vert,
                fragment: frag,
                name: 'test-nebula'
            });

            const filter = new PIXI.Filter({
                glProgram: glProgram,
                resources: {
                    nebulaUniforms: {
                        uTime: { value: 1.0, type: 'f32' },
                        uColorA: { value: [0.1, 0.2, 0.5], type: 'vec3<f32>' },
                        uColorB: { value: [0.5, 0.1, 0.3], type: 'vec3<f32>' }
                    }
                }
            });

            const testContainer = new PIXI.Container();
            const g = new PIXI.Graphics();
            g.beginFill(0xffffff);
            g.drawRect(0, 0, 300, 300);
            g.endFill();
            testContainer.addChild(g);
            testContainer.filters = [filter];
            window.pixiApp.stage.addChild(testContainer);
            window.pixiApp.render();
            window.pixiApp.stage.removeChild(testContainer);

            return { success: true };
        } catch(e) {
            return { error: e.message, stack: e.stack };
        }
    })()
    """)
    print("[*] Pixi v8 Filter Render Test Result:\n", json.dumps(res, indent=2))

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
