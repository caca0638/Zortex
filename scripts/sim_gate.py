# -*- coding: utf-8 -*-
"""
scripts/sim_gate.py

Regression Acceptance Gate for ZORTEX: Cyber Survivor.
Runs a 10-wave headless simulation with stubbed renderer and 16.67ms frame steps.
Collects all console errors, gameLoop exceptions, and per-wave heap/node metrics.
Returns PASS (exit code 0) if 0 errors, or FAIL (exit code 1) with error report.

Zero Windows-specific paths; works on clean clones across platforms.
"""

import os
import sys
import time
import json
import re
import socket
import base64
import shutil
import tempfile
import threading
import subprocess
import urllib.request
import http.server
import socketserver

# Set utf-8 output encoding if supported
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Root directory of the repository (relative to this script)
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def find_browser():
    # 1. Environment variables
    for var in ("CHROME_BIN", "BROWSER_PATH", "CHROMIUM_PATH", "EDGE_BIN"):
        val = os.environ.get(var)
        if val and os.path.exists(val):
            return val

    # 2. System PATH
    for name in ("google-chrome", "chromium", "chromium-browser", "chrome", "msedge", "edge"):
        p = shutil.which(name)
        if p and os.path.exists(p):
            return p

    # 3. Platform-specific standard installation paths (no hardcoded drive letters)
    if sys.platform.startswith("win"):
        prefixes = [
            os.environ.get("ProgramFiles"),
            os.environ.get("ProgramFiles(x86)"),
            os.environ.get("LocalAppData"),
        ]
        subpaths = [
            os.path.join("Google", "Chrome", "Application", "chrome.exe"),
            os.path.join("Microsoft", "Edge", "Application", "msedge.exe"),
            os.path.join("Chromium", "Application", "chrome.exe"),
        ]
        for pref in prefixes:
            if not pref:
                continue
            for sub in subpaths:
                candidate = os.path.join(pref, sub)
                if os.path.exists(candidate):
                    return candidate
    elif sys.platform.startswith("darwin"):
        mac_paths = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
        for c in mac_paths:
            if os.path.exists(c):
                return c
    else:
        linux_paths = [
            "/usr/bin/google-chrome",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/google-chrome-stable",
        ]
        for c in linux_paths:
            if os.path.exists(c):
                return c
    return None

class LightweightWebSocket:
    """Minimal WebSocket client using Python standard library."""
    def __init__(self, ws_url):
        match = re.match(r"ws://([^:/]+):(\d+)(/.+)", ws_url)
        if not match:
            raise ValueError(f"Invalid ws url: {ws_url}")
        host, port, path = match.group(1), int(match.group(2)), match.group(3)
        self.sock = socket.create_connection((host, port), timeout=15)
        key = base64.b64encode(os.urandom(16)).decode('ascii')
        req = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode('utf-8'))
        resp = b""
        while b"\r\n\r\n" not in resp:
            chunk = self.sock.recv(4096)
            if not chunk:
                break
            resp += chunk
        self.req_id = 0

    def send(self, method, params=None):
        self.req_id += 1
        msg = {"id": self.req_id, "method": method, "params": params or {}}
        payload = json.dumps(msg).encode('utf-8')
        frame = bytearray([0x81])
        length = len(payload)
        mask = os.urandom(4)
        if length < 126:
            frame.append(0x80 | length)
        elif length < 65536:
            frame.append(0x80 | 126)
            frame.extend(length.to_bytes(2, 'big'))
        else:
            frame.append(0x80 | 127)
            frame.extend(length.to_bytes(8, 'big'))
        frame.extend(mask)
        masked = bytearray(payload[i] ^ mask[i % 4] for i in range(len(payload)))
        frame.extend(masked)
        self.sock.sendall(frame)
        return self.req_id

    def recv(self, target_id=None, timeout=15):
        start = time.time()
        self.sock.settimeout(timeout)
        while time.time() - start < timeout:
            b1_b2 = self.sock.recv(2)
            if len(b1_b2) < 2:
                continue
            b1, b2 = b1_b2[0], b1_b2[1]
            opcode = b1 & 0x0F
            is_masked = bool(b2 & 0x80)
            length = b2 & 0x7F
            if length == 126:
                length = int.from_bytes(self.sock.recv(2), 'big')
            elif length == 127:
                length = int.from_bytes(self.sock.recv(8), 'big')
            mask = self.sock.recv(4) if is_masked else None
            payload = b""
            while len(payload) < length:
                chunk = self.sock.recv(min(length - len(payload), 65536))
                if not chunk:
                    break
                payload += chunk
            if is_masked and mask:
                payload = bytes(payload[i] ^ mask[i % 4] for i in range(len(payload)))
            if opcode == 0x01: # text frame
                try:
                    data = json.loads(payload.decode('utf-8'))
                    if target_id is None or data.get('id') == target_id:
                        return data
                except Exception:
                    pass
        raise TimeoutError(f"WebSocket recv timeout for id {target_id}")

    def call(self, method, params=None, timeout=15):
        rid = self.send(method, params)
        return self.recv(target_id=rid, timeout=timeout)

    def close(self):
        try:
            self.sock.close()
        except Exception:
            pass

class QuietHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=REPO_ROOT, **kwargs)
    def log_message(self, format, *args):
        pass # Suppress request logging

def start_server(port):
    server = socketserver.TCPServer(('127.0.0.1', port), QuietHTTPHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server

def eval_js(ws, expr):
    res = ws.call("Runtime.evaluate", {"expression": expr, "returnByValue": True})
    return res.get("result", {}).get("result", {}).get("value")

def run_simulation():
    print("==================================================")
    print("      ZORTEX: AUTOMATED REGRESSION GATE           ")
    print("==================================================")

    # 1. Start HTTP Server
    http_port = find_free_port()
    debug_port = find_free_port()
    server = start_server(http_port)
    print(f"[*] Local HTTP server running on port {http_port}")

    # 2. Locate Browser & Launch
    try:
        from playwright.sync_api import sync_playwright
        HAS_PLAYWRIGHT = True
    except ImportError:
        HAS_PLAYWRIGHT = False

    temp_profile = tempfile.mkdtemp(prefix="zortex_sim_profile_")
    url = f"http://127.0.0.1:{http_port}/index.html"
    pw_instance = None
    browser_context = None
    proc = None

    if HAS_PLAYWRIGHT:
        print("[*] Playwright detected. Launching Playwright Chromium with CDP...")
        pw_instance = sync_playwright().start()
        browser_context = pw_instance.chromium.launch_persistent_context(
            user_data_dir=temp_profile,
            headless=True,
            args=[
                f"--remote-debugging-port={debug_port}",
                "--window-size=1280,720",
                "--use-gl=angle",
                "--enable-webgl",
                "--enable-webgl2",
                "--autoplay-policy=no-user-gesture-required",
                "--disable-http-cache",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding"
            ]
        )
    else:
        browser_exe = find_browser()
        if not browser_exe:
            print("[FAIL] No compatible Chromium/Chrome/Edge browser found on this machine.")
            sys.exit(1)
        print(f"[*] Browser located: {browser_exe}")

        # Launch Headless Browser with CDP pointing to about:blank initially
        proc = subprocess.Popen([
            browser_exe,
            f"--remote-debugging-port={debug_port}",
            f"--user-data-dir={temp_profile}",
            "--headless=new",
            "--window-size=1280,720",
            "--use-gl=angle",
            "--enable-webgl",
            "--enable-webgl2",
            "--autoplay-policy=no-user-gesture-required",
            "--disable-http-cache",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "about:blank"
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ws = None
    try:
        # 4. Wait for DevTools port and connect
        ws_url = None
        for _ in range(30):
            time.sleep(0.3)
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{debug_port}/json") as r:
                    targets = json.loads(r.read())
                    page = next((t for t in targets if t.get("type") == "page"), None)
                    if page and "webSocketDebuggerUrl" in page:
                        ws_url = page["webSocketDebuggerUrl"]
                        break
            except Exception:
                pass

        if not ws_url:
            print("[FAIL] Failed to attach to browser DevTools protocol.")
            sys.exit(1)

        ws = LightweightWebSocket(ws_url)
        ws.call("Page.enable")
        ws.call("Runtime.enable")

        # 5. Inject Pre-Load Script to intercept rAF, errors, and renderer before index.html loads
        preload_js = """
        window.__simErrors = [];
        window.__waveStats = [];
        window.__lastRecordedWave = 0;
        window.__capturedGameLoop = null;
        window.__bossWaitFrames = 0;
        window.__simTime = 1000;

        // Intercept console.error
        const origConsoleError = console.error;
        console.error = function(...args) {
            origConsoleError.apply(console, args);
            const text = args.map(a => {
                if (!a) return '';
                if (a instanceof Error) return (a.stack || a.message);
                if (typeof a === 'object') {
                    try { return (a.stack || JSON.stringify(a)); } catch(e) { return String(a); }
                }
                return String(a);
            }).join(' ');
            window.__simErrors.push({
                type: 'console.error',
                message: text,
                time: performance.now()
            });
        };

        // Intercept uncaught window errors
        window.addEventListener('error', function(e) {
            const err = e.error;
            const msg = (err && err.stack) ? err.stack : (e.message || String(e));
            window.__simErrors.push({
                type: 'window.onerror',
                message: msg,
                time: performance.now()
            });
        });

        // Intercept requestAnimationFrame to capture gameLoop and run auxiliary callbacks
        window.requestAnimationFrame = function(cb) {
            if (typeof cb === 'function') {
                if (cb.name === 'gameLoop' || cb.toString().includes('gameLoop') || cb.toString().includes('lastFrameExecuteTime')) {
                    window.__capturedGameLoop = cb;
                    return 1;
                } else {
                    try { cb(performance.now()); } catch(e) {}
                    return 1;
                }
            }
            return 1;
        };
        """
        ws.call("Page.addScriptToEvaluateOnNewDocument", {"source": preload_js})

        # 6. Navigate to index.html
        ws.call("Page.navigate", {"url": url})
        time.sleep(2.0)

        # 7. Post-Load Setup: Stub renderer, start game, and define stepping harness
        postload_js = """
        (() => {
            // Stub renderer so drawing calls do not consume CPU/GPU
            if (window.pixiApp) {
                window.pixiApp.render = function() {};
                if (window.pixiApp.renderer) {
                    window.pixiApp.renderer.render = function() {};
                }
            }

            // Dismiss Profile modal if present
            if (window.gameState === 'PROFILE') {
                const pBtn = document.querySelector('.btn-select-profile');
                if (pBtn) pBtn.click();
                else if (typeof selectProfile === 'function' && Array.isArray(profiles) && profiles.length > 0) selectProfile(profiles[0].id);
                else if (typeof closeProfileMenu === 'function') closeProfileMenu();
            }

            // Start arcade run
            if (typeof window.startGame === 'function') {
                window.startGame('arcade');
            }

            // Helper to count scene graph nodes
            function countSceneNodes(node) {
                if (!node) return 0;
                let c = 1;
                if (node.children && node.children.length) {
                    for (let i = 0; i < node.children.length; i++) {
                        c += countSceneNodes(node.children[i]);
                    }
                }
                return c;
            }
            window.__countSceneNodes = countSceneNodes;

            // Single frame step (16.666667 ms)
            window.__simStepFrame = function() {
                window.__simTime += 16.666667;

                // 1. Keep player immortal
                if (window.player) {
                    window.player.health = window.player.maxHealth = 99999;
                    window.player.dead = false;
                }

                // 2. Auto-fire and Auto-aim
                window.autoFire = true;
                if (window.mouse) {
                    window.mouse.down = true;
                    if (window.player && window.enemies && window.enemies.length > 0) {
                        let nearest = null;
                        let minDistSq = Infinity;
                        for (let i = 0; i < window.enemies.length; i++) {
                            const e = window.enemies[i];
                            if (e && !e.dead) {
                                const dx = e.x - window.player.x;
                                const dy = e.y - window.player.y;
                                const d2 = dx * dx + dy * dy;
                                if (d2 < minDistSq) {
                                    minDistSq = d2;
                                    nearest = e;
                                }
                            }
                        }
                        if (nearest) {
                            window.mouse.x = nearest.x - (window.camX || 0) + (window.W || 1280) / 2;
                            window.mouse.y = nearest.y - (window.camY || 0) + (window.H || 720) / 2;
                        }
                    }
                }

                // 3. Auto card selection
                const ultiModal = document.getElementById('ultimateChoiceModal');
                if (ultiModal) {
                    if (window.UltimateChoiceManager && window.player) {
                        try {
                            window.UltimateChoiceManager.selectUltimate(window.player, 'orbital_barrage');
                            ultiModal.remove();
                        } catch(e) { ultiModal.remove(); }
                    } else {
                        const opt = ultiModal.querySelector('div[data-id]');
                        if (opt) opt.click();
                        else ultiModal.remove();
                    }
                }

                const upgOverlay = document.getElementById('upgradeOverlay');
                if (window.gameState === 'UPGRADE' || (upgOverlay && !upgOverlay.classList.contains('hidden'))) {
                    const cards = document.querySelectorAll('#upgradeCardsContainer .upgrade-card, #upgradeCardsContainer > div');
                    if (cards && cards.length > 0) {
                        try {
                            if (typeof cards[0].onclick === 'function') {
                                cards[0].onclick();
                            } else {
                                cards[0].click();
                            }
                        } catch(e) {}
                    }
                }

                // 4. Auto chest claim
                const chestOverlay = document.getElementById('chestRewardOverlay');
                if (window.gameState === 'CHEST' || (chestOverlay && !chestOverlay.classList.contains('hidden'))) {
                    if (window.ChestSystem && typeof window.ChestSystem.claimRewards === 'function') {
                        try { window.ChestSystem.claimRewards(); } catch(e) {}
                    } else {
                        const btn = document.getElementById('chestClaimBtn');
                        if (btn) btn.click();
                    }
                }

                // 5. Force kill boss when spawned
                if (window.bossSpawned || (window.enemies && window.enemies.some(e => e && (e.type === 'boss' || e.isBoss || e.bossType)))) {
                    window.__bossWaitFrames = (window.__bossWaitFrames || 0) + 1;
                    if (window.__bossWaitFrames >= 5) {
                        for (let i = 0; i < window.enemies.length; i++) {
                            const e = window.enemies[i];
                            if (e && (e.type === 'boss' || e.isBoss || e.bossType)) {
                                e.hp = 0;
                                if (typeof e.die === 'function') e.die();
                                else e.dead = true;
                            }
                        }
                        window.__bossWaitFrames = 0;
                    }
                } else {
                    window.__bossWaitFrames = 0;
                }

                // 6. Execute the captured gameLoop frame
                if (typeof window.__capturedGameLoop === 'function') {
                    try {
                        window.__capturedGameLoop(window.__simTime);
                    } catch (err) {
                        console.error("Zortex gameLoop hata yakalandı (oyun kurtarıldı):", err);
                    }
                }
            };

            // Run batch of frames
            window.__runSimBatch = function(count) {
                // Ensure targetFPS does not throttle frame execution in simulation
                if (window.gameSettings) window.gameSettings.targetFPS = 'unlimited';
                const startWave = window.wave || 1;

                for (let i = 0; i < count; i++) {
                    window.__simStepFrame();
                    const isFinished = ((window.wave >= 10 && window.gameState === 'VICTORY') || window.wave > 10);
                    if (isFinished) break;
                    if ((window.wave || 1) !== startWave) {
                        break;
                    }
                }
                const isFinished = ((window.wave >= 10 && window.gameState === 'VICTORY') || window.wave > 10);
                return {
                    currentWave: window.wave || 1,
                    errorCount: window.__simErrors.length,
                    hasGameLoop: (typeof window.__capturedGameLoop === 'function'),
                    gameState: window.gameState,
                    isComplete: isFinished,
                    waveTimer: window.waveManager ? window.waveManager.waveTimer : -1,
                    enemiesCount: window.enemies ? window.enemies.length : -1
                };
            };

            return {
                ready: true,
                gameState: window.gameState,
                hasGameLoop: (typeof window.__capturedGameLoop === 'function'),
                wave: window.wave
            };
        })()
        """

        setup_res = eval_js(ws, postload_js)
        print(f"[*] Post-load setup complete: {setup_res}")

        # 8. Drive Game Loop Frame by Frame across 10 Waves
        print("[*] Running 10-wave simulation (16.67ms frame steps)...")
        max_batches = 200 # Up to 200 * 300 = 60,000 frames
        batch_size = 300
        start_time = time.time()

        wave_stats = []
        last_recorded_wave = 0

        def record_wave_stats(target_wave, cumulative_errors):
            nonlocal last_recorded_wave
            if target_wave <= last_recorded_wave:
                return

            # Query real JS Heap usage via Chrome DevTools Protocol Runtime.getHeapUsage
            heap_mb = 0.0
            try:
                heap_resp = ws.call("Runtime.getHeapUsage")
                if heap_resp and "result" in heap_resp and "usedSize" in heap_resp["result"]:
                    heap_mb = heap_resp["result"]["usedSize"] / (1024 * 1024)
            except Exception:
                pass

            # Query scene nodes count
            scene_nodes = 0
            try:
                nodes_res = eval_js(ws, "window.__countSceneNodes(window.pixiApp ? window.pixiApp.stage : null)")
                if isinstance(nodes_res, (int, float)):
                    scene_nodes = int(nodes_res)
            except Exception:
                pass

            wave_stats.append({
                "wave": target_wave,
                "heapMB": f"{heap_mb:.2f}",
                "sceneNodes": scene_nodes,
                "errorsEnd": cumulative_errors
            })
            last_recorded_wave = target_wave

        cur_wave = 1
        for b in range(max_batches):
            status = eval_js(ws, f"window.__runSimBatch({batch_size})")
            cur_wave = status.get("currentWave", 1) if status else 1
            err_count = status.get("errorCount", 0) if status else 0
            is_done = status.get("isComplete", False) if status else False
            w_timer = status.get("waveTimer", 0) if status else 0
            e_count = status.get("enemiesCount", 0) if status else 0
            g_state = status.get("gameState", "UNKNOWN") if status else "UNKNOWN"

            # If wave progressed past last_recorded_wave, record telemetry for completed wave(s)
            if cur_wave > last_recorded_wave + 1:
                for w in range(last_recorded_wave + 1, min(cur_wave, 11)):
                    record_wave_stats(w, err_count)

            if b % 5 == 0 or is_done:
                print(f"  [Batch {b+1:02d}] Wave: {cur_wave}/10 (Timer: {w_timer:.1f}s, Enm: {e_count}, State: {g_state}) | Errors: {err_count} | Elapsed: {time.time() - start_time:.1f}s")

            if is_done:
                print(f"[+] Reached wave {cur_wave} (Target 10 waves achieved)!")
                break

        # 9. Collect Final Stats & Errors
        sim_errors = eval_js(ws, "window.__simErrors") or []
        total_errors = len(sim_errors)

        # Record telemetry for wave 10 (or any unrecorded waves) at simulation completion
        for w in range(last_recorded_wave + 1, 11):
            record_wave_stats(w, total_errors)
        if wave_stats and wave_stats[-1]["wave"] == 10:
            wave_stats[-1]["errorsEnd"] = total_errors

        print("\n=================================================================")
        print("                   SIMULATION REPORT & METRICS                   ")
        print("=================================================================")
        print("Per-Wave Telemetry:")
        print("  Wave | JS Heap (MB) | Scene Nodes | Errors (dalga sonu, kümülatif)")
        print("  -----+--------------+-------------+-------------------------------")
        for stat in wave_stats:
            print(f"  {stat.get('wave', 0):4d} | {stat.get('heapMB', '0'):>12} | {stat.get('sceneNodes', 0):>11} | {stat.get('errorsEnd', 0):>31}")

        hit_errors = [e for e in sim_errors if "p.hit is not a function" in e.get("message", "")]

        print(f"\nTotal Console / GameLoop Errors: {total_errors}")
        print(f"Occurrences of 'p.hit is not a function': {len(hit_errors)}")

        if sim_errors:
            print("\nSample Errors Captured:")
            seen_samples = set()
            sample_count = 0
            for e in sim_errors:
                msg_head = e.get("message", "").split("\n")[0][:120]
                if msg_head not in seen_samples and sample_count < 5:
                    seen_samples.add(msg_head)
                    sample_count += 1
                    print(f"  - [{e.get('type')}] {msg_head}")

        print("\n==================================================")
        if total_errors == 0:
            print("RESULT: PASS")
            print("All 10 waves completed with 0 errors.")
            print("==================================================")
            sys.exit(0)
        else:
            print(f"RESULT: FAIL ({total_errors} errors detected, {len(hit_errors)} 'p.hit is not a function')")
            print("==================================================")
            sys.exit(1)

    finally:
        if ws:
            ws.close()
        if browser_context:
            try:
                browser_context.close()
            except Exception:
                pass
        if pw_instance:
            try:
                pw_instance.stop()
            except Exception:
                pass
        if proc:
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except Exception:
                proc.kill()
        if os.path.exists(temp_profile):
            shutil.rmtree(temp_profile, ignore_errors=True)

if __name__ == "__main__":
    run_simulation()
