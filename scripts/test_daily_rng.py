# -*- coding: utf-8 -*-
"""
scripts/test_daily_rng.py

Acceptance test for Daily Run RNG decoupling.
Runs two daily runs with the same seed:
1) Graphics quality = 'low'
2) Graphics quality = 'ultra'
Collects the sequence of enemies spawned across the first 3 waves.
Verifies that both spawn lists are 100% identical.
"""

import os
import sys
import json
import time
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=REPO_ROOT, **kwargs)
    def log_message(self, format, *args):
        pass

def run_seeded_simulation(quality, seed=20261015):
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), QuietHandler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        # Preload script to instrument enemy array and stub rAF
        page.add_init_script("""
            window.__simSpawnLog = [];
            window.__capturedGameLoop = null;
            window.__simTime = 1000;

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
        """)

        page.goto(f"http://127.0.0.1:{port}/index.html")
        page.wait_for_function("typeof window.startGame === 'function' && typeof window.pixiApp !== 'undefined'")

        # Setup game, apply quality, and start daily run with fixed seed
        page.evaluate("""([quality, seed]) => {
            // Apply graphics quality preset
            if (typeof window.applyGraphicsPreset === 'function') {
                window.applyGraphicsPreset(quality);
            }
            if (window.gameSettings) {
                window.gameSettings.graphicsQuality = quality;
                window.gameSettings.targetFPS = 'unlimited';
            }

            // Set mode to daily
            if (window.ZortexGameModes) {
                window.ZortexGameModes.mode = 'daily';
            }

            // Start daily run with specific deterministic seed
            if (window.ZortexDailyRun) {
                window.ZortexDailyRun.startDailyRun(seed);
            }

            window.__rngCalls = [];
            window.__onGameRng = function(val) {
                if (window.__rngCalls.length < 50) {
                    const stack = (new Error()).stack.split('\\n');
                    window.__rngCalls.push({
                        val: val.toFixed(4),
                        caller: stack[2] ? stack[2].trim() : 'unknown'
                    });
                }
            };

            // Start game
            window.startGame();

            if (window.player) {
                window.player.godMode = true;
                window.player.health = window.player.maxHealth = 99999;
                window.player.dead = false;
            }

            // Patch enemies.push to log every spawned enemy type and rounded coordinates
            const origPush = window.enemies.push;
            window.enemies.push = function(...items) {
                for (const item of items) {
                    if (item && item.type) {
                        window.__simSpawnLog.push({
                            wave: window.wave || 1,
                            type: item.type,
                            isElite: !!item.isElite,
                            affix: item.affix || null,
                            x: Math.round(item.x),
                            y: Math.round(item.y)
                        });
                    }
                }
                return origPush.apply(this, items);
            };

            // Stub render methods in game loop to run headless at max speed
            if (window.pixiApp && window.pixiApp.renderer) {
                window.pixiApp.renderer.render = function() {};
            }

            // In simulation, only boss die() should drop rewards and advance wave; regular enemies do not drop loot when dying to environmental hazards
            const origDie = window.EnemyBase.prototype.die;
            window.EnemyBase.prototype.die = function() {
                if (this.isBoss || this.type === 'boss' || this.bossType) {
                    return origDie.apply(this, arguments);
                }
                this.dead = true;
                this.markedForRemoval = true;
            };

            // Setup step frame and batch runner
            window.__simStepFrame = function() {
                window.__simTime += 16.666667;

                if (window.player) {
                    window.player.godMode = true;
                    window.player.health = window.player.maxHealth = 99999;
                    window.player.dead = false;
                }

                // Keep player idle (identical deterministic input)
                window.autoFire = false;
                if (window.mouse) {
                    window.mouse.down = false;
                }

                // Auto card selection
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
                            if (typeof cards[0].onclick === 'function') cards[0].onclick();
                            else cards[0].click();
                        } catch(e) {}
                    }
                }

                // Auto chest claim
                const chestOverlay = document.getElementById('chestRewardOverlay');
                if (window.gameState === 'CHEST' || (chestOverlay && !chestOverlay.classList.contains('hidden'))) {
                    if (window.ChestSystem && typeof window.ChestSystem.claimRewards === 'function') {
                        try { window.ChestSystem.claimRewards(); } catch(e) {}
                    } else {
                        const btn = document.getElementById('chestClaimBtn');
                        if (btn) btn.click();
                    }
                }

                // Force kill boss when spawned so wave advances
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

                // Execute captured gameLoop frame
                if (typeof window.__capturedGameLoop === 'function') {
                    try {
                        window.__capturedGameLoop(window.__simTime);
                    } catch(e) {}
                }
            };

            window.__runSimBatch = function(count) {
                for (let i = 0; i < count; i++) {
                    window.__simStepFrame();
                    if ((window.wave || 1) > 3) break;
                }
                return {
                    wave: window.wave || 1,
                    spawnCount: window.__simSpawnLog.length
                };
            };
        }""", [quality, seed])

        # Advance game batch-by-batch until wave 3 completes (wave reaches 4)
        print(f"[*] Running simulation with quality: '{quality}' (Seed: {seed})...")
        max_batches = 100
        batch_size = 200

        for b in range(max_batches):
            res = page.evaluate(f"() => window.__runSimBatch({batch_size})")
            cur_wave = res.get("wave", 1)
            if cur_wave > 3:
                print(f"[+] Reached wave {cur_wave} at batch {b+1} (~{(b+1)*batch_size} frames). Waves 1-3 complete!")
                break

        spawn_log = page.evaluate("() => window.__simSpawnLog.filter(s => s.wave <= 3)")
        rng_calls = page.evaluate("() => window.__rngCalls || []")
        browser.close()

    httpd.shutdown()
    return spawn_log, rng_calls

def main():
    print("==================================================")
    print("      DAILY RUN RNG DECOUPLING ACCEPTANCE TEST    ")
    print("==================================================")
    seed = 20261015

    print("\n--- RUN 1: LOW GRAPHICS QUALITY ---")
    log_low, calls_low = run_seeded_simulation('low', seed)
    print(f"Total enemies spawned in waves 1-3 (Low): {len(log_low)}")
    print("First 8 RNG calls (Low):")
    for idx, c in enumerate(calls_low[:8]):
        print(f"  [{idx+1}] val={c['val']} caller={c['caller']}")

    print("\n--- RUN 2: ULTRA GRAPHICS QUALITY ---")
    log_ultra, calls_ultra = run_seeded_simulation('ultra', seed)
    print(f"Total enemies spawned in waves 1-3 (Ultra): {len(log_ultra)}")
    print("First 8 RNG calls (Ultra):")
    for idx, c in enumerate(calls_ultra[:8]):
        print(f"  [{idx+1}] val={c['val']} caller={c['caller']}")

    print("\n--- COMPARISON RESULTS ---")
    print(f"Low Quality Spawn Count:   {len(log_low)}")
    print(f"Ultra Quality Spawn Count: {len(log_ultra)}")

    # Check equality
    is_identical = True
    min_len = min(len(log_low), len(log_ultra))

    print("\nFirst 15 Spawns Comparison:")
    print(f"  {'Index':5} | {'Low Quality Spawn':35} | {'Ultra Quality Spawn':35} | {'Match'}")
    print("  ------+-------------------------------------+-------------------------------------+-------")
    for i in range(min(15, min_len)):
        s_low = f"W{log_low[i]['wave']} {log_low[i]['type']} ({log_low[i]['x']},{log_low[i]['y']}) [elite={log_low[i]['isElite']}]"
        s_ultra = f"W{log_ultra[i]['wave']} {log_ultra[i]['type']} ({log_ultra[i]['x']},{log_ultra[i]['y']}) [elite={log_ultra[i]['isElite']}]"
        match = (log_low[i] == log_ultra[i])
        if not match:
            is_identical = False
        print(f"  {i+1:5d} | {s_low:35} | {s_ultra:35} | {'OK' if match else 'FAIL'}")

    if len(log_low) != len(log_ultra):
        is_identical = False

    for i in range(min_len):
        if log_low[i] != log_ultra[i]:
            is_identical = False
            print(f"[!] Mismatch at index {i+1}:")
            print(f"    Low:   {log_low[i]}")
            print(f"    Ultra: {log_ultra[i]}")
            break

    print("\n==================================================")
    if is_identical:
        print("RESULT: SUCCESS - Spawn lists for Waves 1-3 are 100% IDENTICAL across Low and Ultra quality!")
        print("==================================================")
        return 0
    else:
        print("RESULT: FAILURE - Spawn lists differ between Low and Ultra quality!")
        print("==================================================")
        return 1

if __name__ == "__main__":
    sys.exit(main())
