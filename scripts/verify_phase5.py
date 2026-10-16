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

PORT = 8196
DEBUG_PORT = 9426
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_phase5_combat_{int(time.time())}"

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

    # 1. Start game and grant player godMode + orbital shields
    diag = ws.eval("""
    (() => {
        try {
            if (typeof startGame === 'function') startGame();
            
            if (window.player) {
                window.player.godMode = true;
                window.player.addOrbitalShield();
                window.player.addOrbitalShield();
                window.player.addOrbitalShield();
            }

            // Test damage aggregation in TextManager
            const tm = window.textManager;
            const initActive = tm ? tm.activeCount : 0;
            if (tm) {
                tm.add('15', 600, 320, '#00f3ff');
                tm.add('15', 602, 321, '#00f3ff');
                tm.add('20', 601, 319, '#00f3ff');
            }
            const postActive = tm ? tm.activeCount : 0;
            const clumpedText = tm && tm.activeCount > 0 ? tm.pool[tm.activeCount - 1].text : '';

            // Check density alpha
            const dAlphaLow = window.ZortexFX ? window.ZortexFX.getDensityAlpha(10) : 0;
            const dAlphaHigh = window.ZortexFX ? window.ZortexFX.getDensityAlpha(80) : 0;

            return {
                ok: true,
                hasOrbitalShields: Boolean(window.player && window.player.orbitalShields && window.player.orbitalShields.length === 3),
                clumpingWorked: (postActive - initActive === 1) && clumpedText.startsWith('50'),
                clumpedText: clumpedText,
                dAlphaLow: dAlphaLow,
                dAlphaHigh: dAlphaHigh,
                hasEnemyBulletTex: Boolean(window.pixiTextures && window.pixiTextures.bullet_enemy)
            };
        } catch(e) {
            return { ok: false, error: e.stack || e.message };
        }
    })()
    """)
    print("[*] Phase 5 Diagnostic:", diag)

    # 2. Spawn enemies and enemy bullets circling the player
    ws.eval("""
    (() => {
        if (typeof Enemy !== 'undefined' && window.enemies) {
            for (let i = 0; i < 18; i++) {
                const ang = (i / 18) * Math.PI * 2;
                const dist = 240;
                enemies.push(new Enemy(window.player.x + Math.cos(ang) * dist, window.player.y + Math.sin(ang) * dist, i % 3 === 0 ? 'shooter' : 'scout'));
            }
        }
        if (typeof EnemyBullet !== 'undefined' && window.enemyBullets) {
            for (let i = 0; i < 12; i++) {
                const ang = (i / 12) * Math.PI * 2;
                enemyBullets.push(new EnemyBullet(window.player.x + Math.cos(ang) * 160, window.player.y + Math.sin(ang) * 160, ang + Math.PI, 3.2, 12));
            }
        }
        // Shoot player weapons for combat visuals
        if (window.player) {
            window.player.shoot();
        }
    })()
    """)
    time.sleep(0.8)

    # 3. Measure FPS
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
                    resolve({ avg: Math.round(avg * 10) / 10, min: Math.round(Math.min(...samples)), max: Math.round(Math.max(...samples)) });
                }
            }
            requestAnimationFrame(measure);
        });
    })()
    """)
    print("[*] FPS Measurement:", fps_res)

    # 4. Check console errors
    logged_errors = ws.eval("window.__loggedErrors || []")
    print("[*] Console errors:", logged_errors)

    # 5. Capture screenshot during active combat
    shot = ws.call("Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(shot["result"]["data"])
    
    out_dir = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950"
    out_path = os.path.join(out_dir, "phase5_readability_verified.png")
    with open(out_path, "wb") as f:
        f.write(img_data)
    print(f"[*] Screenshot saved to: {out_path} ({len(img_data)} bytes)")

    # Local workspace copy
    with open(r"C:\Users\user\Desktop\zort\phase5_readability_verified.png", "wb") as f:
        f.write(img_data)

finally:
    try: browser_proc.kill()
    except: pass
    try: app_proc.kill()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
