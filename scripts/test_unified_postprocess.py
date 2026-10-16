import urllib.request
import json
import subprocess
import time
import sys
import os

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8192
DEBUG_PORT = 9422
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_testunified_{int(time.time())}"

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

                uniform sampler2D uTexture;
                uniform float uTime;
                uniform float uGrainStrength;
                uniform float uVignetteStrength;
                uniform float uContrast;
                uniform float uSaturation;

                float rand(vec2 co) {
                    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main(void) {
                    vec4 color = texture(uTexture, vTextureCoord);

                    // 1. Color Grading
                    color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
                    float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
                    color.rgb = mix(vec3(luma), color.rgb, uSaturation);

                    // 2. Film Grain
                    if (uGrainStrength > 0.001) {
                        float noise = (rand(vTextureCoord * 2.5 + fract(uTime)) - 0.5) * uGrainStrength;
                        color.rgb += noise;
                    }

                    // 3. Vignette
                    if (uVignetteStrength > 0.001) {
                        vec2 uv = (vTextureCoord - 0.5) * 2.0;
                        float dist = dot(uv, uv);
                        float vig = clamp(1.0 - dist * (uVignetteStrength * 0.45), 0.0, 1.0);
                        color.rgb *= vig;
                    }

                    finalColor = color;
                }
            `;

            const glProgram = PIXI.GlProgram.from({
                vertex: vert,
                fragment: frag,
                name: 'unified-postprocess'
            });

            const filter = new PIXI.Filter({
                glProgram: glProgram,
                resources: {
                    postUniforms: {
                        uTime: { value: 0.0, type: 'f32' },
                        uGrainStrength: { value: 0.035, type: 'f32' },
                        uVignetteStrength: { value: 0.35, type: 'f32' },
                        uContrast: { value: 1.08, type: 'f32' },
                        uSaturation: { value: 1.10, type: 'f32' }
                    }
                }
            });

            window.worldContainer.filters = [filter];
            window.pixiApp.renderer.render(window.pixiApp.stage);
            return { ok: true, filterCreated: true };
        } catch(e) {
            return { ok: false, error: e.stack || e.message };
        }
    })()
    """)
    print("[*] Unified PostProcess Filter test result:", res)
finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
