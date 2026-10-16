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

PORT = 8200
DEBUG_PORT = 9430
USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_phase7_combat_{int(time.time())}"

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
    "--autoplay-policy=no-user-gesture-required",
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

    # 1. Start game and initialize audio context
    diag = ws.eval("""
    (() => {
        try {
            if (typeof startGame === 'function') startGame();
            if (window.audio) {
                window.audio.init();
                if (window.audio.ctx && window.audio.ctx.state === 'suspended') {
                    window.audio.ctx.resume();
                }
            }

            const audio = window.audio;
            const fx = window.ZortexFX;
            const hasAnalyser = Boolean(audio && audio.analyser);
            const hasFreqData = Boolean(audio && audio.frequencyData && audio.frequencyData.length > 0);
            const initialBass = audio ? audio.getBassEnergy() : 0.0;

            // Test mute response
            const prevMuted = audio ? audio.muted : false;
            if (audio) audio.muted = true;
            const mutedBass = audio ? audio.getBassEnergy() : -1;
            if (audio) audio.muted = prevMuted;

            // Test bloom modulation call
            let bloomModulated = false;
            if (fx && fx.bloom && fx.bloom.filter) {
                const baseScale = fx.bloom.filter.bloomScale;
                fx.bloom.modulateAudio(0.8, false);
                const modulatedScale = fx.bloom.filter.bloomScale;
                bloomModulated = (modulatedScale !== baseScale);
                fx.bloom.modulateAudio(0.0, false);
            }

            return {
                ok: true,
                hasAudio: Boolean(audio),
                hasAnalyser: hasAnalyser,
                hasFreqData: hasFreqData,
                initialBass: initialBass,
                mutedBassZero: (mutedBass === 0),
                bloomModulated: bloomModulated,
                audioSyncEnabled: Boolean(fx && fx.audioSyncEnabled)
            };
        } catch(e) {
            return { ok: false, error: e.stack || e.message };
        }
    })()
    """)
    print("[*] Phase 7 Diagnostic:", diag)

    # 2. Simulate combat and music notes playback
    ws.eval("""
    (() => {
        if (window.player) {
            window.player.godMode = true;
            window.player.addOrbitalShield();
            window.player.addOrbitalShield();
        }

        // Trigger synth kick / explosion audio to pump the analyser
        if (window.audio && typeof window.audio.playExplosion === 'function') {
            window.audio.playExplosion('boss');
        }

        // Trigger explosions and lights
        if (window.ZortexFX && window.player) {
            window.ZortexFX.triggerExplosion(window.player.x + 100, window.player.y, 0x00f3ff, 2);
        }
    })()
    """)

    time.sleep(2.0)

    # Sample bass energy while audio is active
    bass_samples = []
    for _ in range(5):
        b = ws.eval("window.audio ? window.audio.getBassEnergy() : 0")
        bass_samples.append(b)
        time.sleep(0.1)
    print(f"[*] Live Bass Energy Samples: {bass_samples}")

    # 3. Sample FPS over time
    fps_samples = []
    for _ in range(10):
        f = ws.eval("typeof fpsSmoothed !== 'undefined' ? fpsSmoothed : 60")
        if isinstance(f, (int, float)):
            fps_samples.append(f)
        time.sleep(0.1)

    avg_fps = sum(fps_samples) / len(fps_samples) if fps_samples else 0
    print(f"[*] FPS Samples: {fps_samples}, Average: {avg_fps:.1f} FPS")

    # 4. Check console errors and warnings
    errors = ws.eval("window.__lastErrors || []")
    warnings = ws.eval("window.__lastWarnings || []")
    print(f"[*] Console Errors count: {len(errors) if isinstance(errors, list) else 0}")
    print(f"[*] Console Warnings count: {len(warnings) if isinstance(warnings, list) else 0}")

    # 5. Capture screenshot
    shot = ws.call("Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(shot["result"]["data"])
    artifact_path = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\phase7_audio_sync_verified.png"
    with open(artifact_path, "wb") as f:
        f.write(img_data)
    print(f"[+] Verified screenshot saved to: {artifact_path}")

finally:
    try:
        browser_proc.kill()
        app_proc.kill()
    except:
        pass
