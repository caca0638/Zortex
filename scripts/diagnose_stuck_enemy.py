import urllib.request
import json
import subprocess
import time
import sys
import os

SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
sys.path.insert(0, SCRATCH_DIR)
from test_144hz_delta_time import MinimalWebSocket, find_browser

PORT = 8256
DEBUG_PORT = 9486
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_enemy_diag_{int(time.time())}"

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

    # Start game
    ws.eval("if (typeof startGame === 'function') startGame();")
    time.sleep(1.0)

    # Setup diagnostic hooks in game
    setup_script = """
    (() => {
        window.__consoleErrors = [];
        window.__consoleWarns = [];
        window.addEventListener('error', e => window.__consoleErrors.push(e.message));

        window.player.invulnerable = true;
        window.player.activeWeaponId = 'spread';
        window.player.isFiring = true;
        window.wave = 5; // Jump to wave 5 like in the screenshot

        window.__diagReport = {
            orphanedSprites: 0,
            deadInArray: 0,
            frozenEnemies: 0,
            details: []
        };

        // Every 500ms, check consistency
        window.__diagCheck = setInterval(() => {
            const container = window.pixiEnemiesContainer;
            if (!container) return;

            // 1. Check if any enemy in array has hp <= 0
            for (let e of window.enemies) {
                if (e.hp <= 0) {
                    window.__diagReport.deadInArray++;
                    window.__diagReport.details.push({
                        issue: 'Enemy in window.enemies has hp <= 0',
                        type: e.type,
                        hp: e.hp,
                        x: e.x,
                        y: e.y,
                        hasSprite: !!e.sprite
                    });
                }
            }

            // 2. Check if pixiEnemiesContainer has children whose enemy is NOT in enemies
            const enemySprites = new Set();
            for (let e of window.enemies) {
                if (e.sprite) enemySprites.add(e.sprite);
                if (e.eliteSprite) enemySprites.add(e.eliteSprite);
                if (e.aegisSprite) enemySprites.add(e.aegisSprite);
            }

            for (let child of container.children) {
                if (!enemySprites.has(child)) {
                    window.__diagReport.orphanedSprites++;
                    window.__diagReport.details.push({
                        issue: 'Orphaned child in pixiEnemiesContainer',
                        x: child.x,
                        y: child.y,
                        alpha: child.alpha,
                        visible: child.visible
                    });
                }
            }
        }, 500);
    })()
    """
    ws.eval(setup_script)

    print("[*] Running simulation for 12 seconds in Wave 5 with spread weapon...")
    # Spawn many enemies and black holes to reproduce
    for tick in range(12):
        ws.eval("""
        (() => {
            // Spawn random enemies around
            for (let i = 0; i < 8; i++) {
                const x = 100 + Math.random() * (window.W - 200);
                const y = 100 + Math.random() * (window.H - 200);
                window.enemies.push(new window.Enemy(x, y, Math.random() < 0.5 ? 'scout' : 'phantom'));
            }
            // Move player to target enemies
            if (window.enemies.length > 0) {
                const target = window.enemies[0];
                window.player.x = target.x - 100;
                window.player.y = target.y;
                window.player.angle = 0;
            }
            // Spawn black hole occasionally
            if (Math.random() < 0.25 && typeof spawnBlackHole === 'function') {
                spawnBlackHole();
            }
        })()
        """)
        time.sleep(1.0)

    # Collect report
    res = ws.eval("""
    (() => {
        clearInterval(window.__diagCheck);
        return {
            report: window.__diagReport,
            enemiesCount: window.enemies.length,
            pixiChildrenCount: window.pixiEnemiesContainer ? window.pixiEnemiesContainer.children.length : 0,
            errors: window.__consoleErrors
        };
    })()
    """)

    print("\n================ DIAGNOSTIC RESULT ================")
    print(json.dumps(res, indent=2))
    print("====================================================\n")

finally:
    try: browser_proc.terminate()
    except: pass
    try: app_proc.terminate()
    except: pass
    # os.system("taskkill /F /IM msedge.exe /T 2>nul") # disabled per F3
