import urllib.request
import json
import time
import sys
import os
import subprocess
import base64

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8245
DEBUG_PORT = 9475
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_ugroup_rnd_{int(time.time())}"

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

def capture(ws, name):
    res = ws.call("Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(res["result"]["data"])
    out_dir = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950"
    path = os.path.join(out_dir, f"{name}.png")
    with open(path, "wb") as f:
        f.write(img_data)
    print(f"[+] Screen captured: {name}.png")
    return path

try:
    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json") as r:
        targets = json.loads(r.read())
    page = next((t for t in targets if str(PORT) in t.get("url", "") and t.get("type") == "page"), targets[0])
    ws = MinimalWebSocket(page["webSocketDebuggerUrl"])
    ws.call("Runtime.enable")

    ws.eval("if (typeof startGame === 'function') startGame();")
    time.sleep(1.0)

    # Disable backgrounds and enemies
    ws.eval("""
    (() => {
        window.spawnEnemy = () => {};
        if (window.enemies) window.enemies.length = 0;
        if (window.pixiBackgroundLayer) window.pixiBackgroundLayer.visible = false;
        if (window.pixiEntitiesLayer) window.pixiEntitiesLayer.visible = false;
        if (window.player) {
            window.player.shield = 0;
            window.player.maxShield = 0;
            if (window.player.shieldBubbleSprite) window.player.shieldBubbleSprite.visible = false;
            if (window.player.shieldSprite) window.player.shieldSprite.visible = false;
            window.player.x = 640;
            window.player.y = 360;
        }
    })()
    """)
    time.sleep(0.2)

    vert = """
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
    """

    frag = """
      in vec2 vTextureCoord;
      out vec4 finalColor;
      uniform sampler2D uTexture;
      uniform vec3 uGlowColor;
      uniform float uGlowIntensity;

      void main(void) {
        vec4 baseColor = texture(uTexture, vTextureCoord);
        vec2 px = vec2(0.018, 0.018);
        float a0 = texture(uTexture, vTextureCoord + vec2(-px.x, 0.0)).a;
        float a1 = texture(uTexture, vTextureCoord + vec2( px.x, 0.0)).a;
        float a2 = texture(uTexture, vTextureCoord + vec2(0.0, -px.y)).a;
        float a3 = texture(uTexture, vTextureCoord + vec2(0.0,  px.y)).a;
        
        float edge = clamp(abs(a0 - a1) + abs(a2 - a3), 0.0, 1.0);
        vec3 glow = uGlowColor * (edge * uGlowIntensity);
        finalColor = vec4(baseColor.rgb + glow, max(baseColor.a, edge * uGlowIntensity * 0.75));
      }
    """

    res = ws.eval(f"""
    (() => {{
        try {{
            const vert = `{vert}`;
            const frag = `{frag}`;
            const prog = PIXI.GlProgram.from({{ vertex: vert, fragment: frag, name: 'ugroup-render' }});
            const ug = new PIXI.UniformGroup({{
                uGlowColor: {{ value: new Float32Array([0.0, 0.95, 1.0]), type: 'vec3<f32>' }},
                uGlowIntensity: {{ value: 1.4, type: 'f32' }}
            }});
            const f = new PIXI.Filter({{
                glProgram: prog,
                resources: {{
                    rimUniforms: ug
                }}
            }});
            f.padding = 12;
            window.pixiShipBodyContainer.filters = [f];
            window._testUniformGroup = ug;
            return {{ ok: true }};
        }} catch (e) {{
            return {{ ok: false, err: e.stack || e.message }};
        }}
    }})()
    """)
    print("APPLY UGROUP:", res)
    time.sleep(0.3)
    capture(ws, "ugroup_cyan_glow")

    # Now change color to gold/orange dynamically!
    ws.eval("""
    (() => {
        if (window._testUniformGroup) {
            window._testUniformGroup.uniforms.uGlowColor[0] = 1.0;
            window._testUniformGroup.uniforms.uGlowColor[1] = 0.6;
            window._testUniformGroup.uniforms.uGlowColor[2] = 0.0;
            window._testUniformGroup.uniforms.uGlowIntensity = 2.0;
            window._testUniformGroup.update();
        }
    })()
    """)
    time.sleep(0.3)
    capture(ws, "ugroup_gold_glow")

    errs = ws.eval("window.__lastErrors || []")
    print("ERRS:", errs)

finally:
    browser_proc.kill()
    app_proc.kill()
