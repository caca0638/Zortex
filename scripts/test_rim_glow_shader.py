import urllib.request
import json
import subprocess
import time
import sys
import os

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8197
DEBUG_PORT = 9427
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_test_rim_{int(time.time())}"

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

    res = ws.eval("""
    (() => {
        try {
            const vert = `
              in vec2 aPosition;
              out vec2 vTextureCoord;
              uniform vec4 uInputSize;
              uniform vec4 uOutputFrame;
              uniform vec4 uOutputTexture;

              vec4 filterVertexPosition(void) {
                vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
                position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
                position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
                return vec4(position, 0.0, 1.0);
              }

              vec2 filterTextureCoord(void) {
                return aPosition * (uOutputFrame.zw * uInputSize.zw);
              }

              void main(void) {
                gl_Position = filterVertexPosition();
                vTextureCoord = filterTextureCoord();
              }
            `;

            const frag = `
              in vec2 vTextureCoord;
              out vec4 finalColor;
              uniform sampler2D uTexture;
              uniform vec4 uInputSize;
              uniform vec3 uGlowColor;
              uniform float uGlowIntensity;
              uniform float uTime;

              void main(void) {
                vec4 baseColor = texture(uTexture, vTextureCoord);
                
                vec2 px = uInputSize.zw * 2.0;
                float a0 = texture(uTexture, vTextureCoord + vec2(-px.x, 0.0)).a;
                float a1 = texture(uTexture, vTextureCoord + vec2( px.x, 0.0)).a;
                float a2 = texture(uTexture, vTextureCoord + vec2(0.0, -px.y)).a;
                float a3 = texture(uTexture, vTextureCoord + vec2(0.0,  px.y)).a;
                
                float edge = clamp(abs(a0 - a1) + abs(a2 - a3), 0.0, 1.0);
                float pulse = 0.85 + 0.15 * sin(uTime * 4.0);
                vec3 glow = uGlowColor * (edge * uGlowIntensity * pulse);
                
                finalColor = vec4(baseColor.rgb + glow, max(baseColor.a, edge * uGlowIntensity * 0.8));
              }
            `;

            const glProgram = PIXI.GlProgram.from({
                vertex: vert,
                fragment: frag,
                name: 'rim-glow-filter'
            });

            const filter = new PIXI.Filter({
                glProgram: glProgram,
                resources: {
                    rimUniforms: {
                        uGlowColor: { value: [0.0, 0.95, 1.0], type: 'vec3<f32>' },
                        uGlowIntensity: { value: 1.2, type: 'f32' },
                        uTime: { value: 0.0, type: 'f32' }
                    }
                }
            });
            filter.padding = 10;

            if (window.pixiPlayerContainer) {
                window.pixiPlayerContainer.filters = [filter];
            }

            return { ok: true, filterCreated: Boolean(filter) };
        } catch (e) {
            return { ok: false, error: e.stack || e.message };
        }
    })()
    """)
    print("[*] Shader test result:", res)

    # Let the game loop render for 1 second to verify if any WebGL errors happen during render
    time.sleep(1.0)

    # Check console errors
    logs = ws.call("Runtime.evaluate", {"expression": "window.__lastErrors || []"})
    print("[*] Errors:", logs)

finally:
    try:
        browser_proc.kill()
        app_proc.kill()
    except:
        pass
