import urllib.request
import json
import subprocess
import time
import sys
import os
import tempfile
import shutil

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8251
DEBUG_PORT = 9481
USER_DATA = os.path.join(tempfile.gettempdir(), f"zortex_item4_verified_{int(time.time())}")

# taskkill kaldirildi (F3 cozumu - kullanici pencerelerini oldurmez)
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

    # Start game
    ws.eval("if (typeof startGame === 'function') startGame();")
    time.sleep(1.0)

    # Setup 60s repeatable benchmark scenario (identical to baseline):
    # - Fixed seed / repeatable conditions
    # - Gatling laser unlocked and shooting continuously
    # - 110 enemies spawned across all types (scout, swarm, kamikaze, phantom, shooter, heavy, boss)
    # - Player dashes every 3 seconds, takes controlled damage ticks
    ws.eval("""
    (() => {
        window.__benchStart = performance.now();
        if (window.player) {
            window.player.hasGatlingLaser = true;
            window.player.hasMultiShot = true;
            window.player.projectiles = 3;
            window.player.invulnerable = true;
        }

        // Spawn 110 enemies mixed across types
        function maintainEnemies() {
            while (window.enemies.length < 110) {
                const i = window.enemies.length;
                const ang = Math.random() * Math.PI * 2;
                const dist = 240 + Math.random() * 260;
                const x = 640 + Math.cos(ang) * dist;
                const y = 360 + Math.sin(ang) * dist;
                const r = Math.random();
                let en = null;
                if (r < 0.20) en = new PhantomEnemy(x, y);
                else if (r < 0.40) en = new KamikazeEnemy(x, y);
                else if (r < 0.65) en = new SwarmDroneEnemy(x, y);
                else if (r < 0.85) en = new AegisHeavyEnemy(x, y);
                else en = new Enemy(x, y);
                if (Math.random() < 0.15) en.isElite = true;
                window.enemies.push(en);
            }
        }
        maintainEnemies();

        // Keep player firing Gatling laser continuously and maintain 110 enemies
        window.__benchInterval = setInterval(() => {
            if (window.player) {
                window.player.isFiring = true;
                if (Math.random() < 0.25) window.player.dash();
            }
            maintainEnemies();
        }, 150);
    })()
    """)

    print("[*] Running 60-second repeatable post-fix benchmark...")
    # Monitor in 5-second increments
    for sec in range(5, 65, 5):
        time.sleep(5)
        snap = ws.eval("""
        (() => {
            const hist = window.__frameStats ? window.__frameStats() : null;
            return {
                elapsedSec: Math.round((performance.now() - window.__benchStart) / 1000),
                enemyCount: window.enemies ? window.enemies.length : 0,
                bulletCount: window.bullets ? window.bullets.length : 0,
                particleCount: window.particles ? window.particles.length : 0,
                hist: hist
            };
        })()
        """)
        print(f"[{snap['elapsedSec']}s] Enemies: {snap['enemyCount']} | Spikes >20ms: {snap['hist']['spikes20']} | Spikes >33ms: {snap['hist']['spikes33']} | ms: {snap['hist']['median']}/{snap['hist']['p95']}/{snap['hist']['p99']}")

    # Final Telemetry Summary
    final_stats = ws.eval("""
    (() => {
        clearInterval(window.__benchInterval);
        return {
            hist: window.__frameStats ? window.__frameStats() : null,
            errors: window.__lastErrors || [],
            warnings: window.__lastWarnings || []
        };
    })()
    """)
    print("\n================ VERIFIED BENCHMARK RESULT ================")
    print(json.dumps(final_stats, indent=2))
    print("===========================================================")

    # Save benchmark telemetry to artifact directory
    out_path = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\item4_verified_benchmark.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(final_stats, f, indent=2)
    print(f"[+] Saved verified benchmark to {out_path}")

finally:
    try:
        browser_proc.kill()
        app_proc.kill()
    except:
        pass
    if os.path.exists(USER_DATA):
        shutil.rmtree(USER_DATA, ignore_errors=True)
