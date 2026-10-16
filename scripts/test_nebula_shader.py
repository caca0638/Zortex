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

PORT = 8195
DEBUG_PORT = 9425
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_test_nebula_{int(time.time())}"

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

    # Test complete procedural nebula shader compilation & rendering
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
                uniform vec2 uResolution;
                uniform vec3 uColorA;
                uniform vec3 uColorB;
                uniform vec3 uColorC;
                uniform float uIntensity;

                float hash(vec2 p) {
                    p = fract(p * vec2(123.34, 456.21));
                    p += dot(p, p + 45.32);
                    return fract(p.x * p.y);
                }

                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    float a = hash(i);
                    float b = hash(i + vec2(1.0, 0.0));
                    float c = hash(i + vec2(0.0, 1.0));
                    float d = hash(i + vec2(1.0, 1.0));
                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }

                float fbm(vec2 p) {
                    float v = 0.0;
                    float a = 0.5;
                    mat2 rot = mat2(0.877, 0.479, -0.479, 0.877);
                    for (int i = 0; i < 4; i++) {
                        v += a * noise(p);
                        p = rot * p * 2.0 + vec2(10.0);
                        a *= 0.5;
                    }
                    return v;
                }

                void main(void) {
                    vec2 p = (vTextureCoord - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.2;
                    vec2 q = vec2(fbm(p + vec2(0.0, uTime * 0.015)), fbm(p + vec2(5.2, 1.3)));
                    vec2 r = vec2(fbm(p + 2.5 * q + vec2(1.7, 9.2) + 0.02 * uTime),
                                  fbm(p + 2.5 * q + vec2(8.3, 2.8) + 0.015 * uTime));
                    float f = fbm(p + 3.0 * r);

                    vec3 col = mix(uColorA, uColorB, clamp(f * f * 2.5, 0.0, 1.0));
                    col = mix(col, uColorC, clamp(length(q), 0.0, 1.0));

                    float mask = smoothstep(0.12, 0.82, f);
                    float alpha = mask * uIntensity;

                    finalColor = vec4(col * alpha, alpha);
                }
            `;

            const glProgram = PIXI.GlProgram.from({
                vertex: vert,
                fragment: frag,
                name: 'procedural-nebula'
            });

            const filter = new PIXI.Filter({
                glProgram: glProgram,
                resources: {
                    nebulaUniforms: {
                        uTime: { value: 1.0, type: 'f32' },
                        uResolution: { value: [1280.0, 720.0], type: 'vec2<f32>' },
                        uColorA: { value: [0.05, 0.08, 0.22], type: 'vec3<f32>' },
                        uColorB: { value: [0.18, 0.05, 0.32], type: 'vec3<f32>' },
                        uColorC: { value: [0.02, 0.12, 0.25], type: 'vec3<f32>' },
                        uIntensity: { value: 0.45, type: 'f32' }
                    }
                }
            });

            // Half-resolution quad sprite
            const spr = new PIXI.Sprite(PIXI.Texture.WHITE);
            spr.width = 640;
            spr.height = 360;
            spr.scale.set(2.0, 2.0);
            spr.blendMode = 'add';
            spr.filters = [filter];

            window.pixiApp.stage.addChild(spr);
            window.pixiApp.render();
            window.pixiApp.stage.removeChild(spr);

            return { success: true };
        } catch(e) {
            return { error: e.message, stack: e.stack };
        }
    })()
    """)
    print("[*] Procedural Nebula Compilation Test:\n", json.dumps(res, indent=2))

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
