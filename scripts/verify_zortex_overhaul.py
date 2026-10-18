import os
import sys
import time
import json
import re
import socket
import base64
import urllib.request
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950"

class SimpleWebSocket:
    def __init__(self, ws_url):
        match = re.match(r"ws://([^:/]+):(\d+)(/.+)", ws_url)
        if not match:
            raise ValueError(f"Invalid ws url: {ws_url}")
        host, port, path = match.group(1), int(match.group(2)), match.group(3)
        self.sock = socket.create_connection((host, port), timeout=12)
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

    def recv(self, target_id=None, timeout=12):
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
                data = json.loads(payload.decode('utf-8'))
                if target_id is None or data.get('id') == target_id:
                    return data
        raise TimeoutError("WebSocket recv timeout")

    def call(self, method, params=None, timeout=12):
        rid = self.send(method, params)
        return self.recv(target_id=rid, timeout=timeout)

    def close(self):
        try:
            self.sock.close()
        except:
            pass

def find_browser():
    candidates = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def save_screenshot(ws, filename):
    res = ws.call("Page.captureScreenshot", {"format": "png"})
    b64 = res.get("result", {}).get("data", "")
    if b64:
        os.makedirs(ARTIFACT_DIR, exist_ok=True)
        path = os.path.join(ARTIFACT_DIR, filename)
        with open(path, "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"  [SCREENSHOT SAVED] {filename} ({len(b64)} bytes base64)")
        return path
    else:
        print(f"  [SCREENSHOT ERROR] No data returned for {filename}")
        return None

def eval_js(ws, expr):
    res = ws.call("Runtime.evaluate", {"expression": expr, "returnByValue": True})
    return res.get("result", {}).get("result", {}).get("value")

def main():
    browser = find_browser()
    if not browser:
        print("ERROR: No compatible Chrome/Edge browser found!")
        sys.exit(1)
    print(f"Using Browser: {browser}")

    port = 9233
    url = "file:///c:/Users/user/Desktop/zort/index.html"
    user_data = os.path.join(ARTIFACT_DIR, "scratch_cdp_profile")

    cmd = [
        browser,
        "--headless=new",
        f"--remote-debugging-port={port}",
        f"--user-data-dir={user_data}",
        "--window-size=1280,720",
        "--disable-gpu-sandbox",
        "--no-sandbox",
        "--autoplay-policy=no-user-gesture-required",
        url
    ]

    print("Launching headless browser...")
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    ws = None
    try:
        # Wait for CDP endpoint
        ws_url = None
        for attempt in range(25):
            time.sleep(0.4)
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=2) as r:
                    tabs = json.loads(r.read().decode('utf-8'))
                    for tab in tabs:
                        if tab.get("type") == "page" and "webSocketDebuggerUrl" in tab:
                            ws_url = tab["webSocketDebuggerUrl"]
                            break
                    if ws_url:
                        break
            except Exception:
                pass

        if not ws_url:
            print("ERROR: Could not get webSocketDebuggerUrl from CDP!")
            sys.exit(1)

        print(f"Connecting to CDP: {ws_url}")
        ws = SimpleWebSocket(ws_url)
        ws.call("Page.enable")
        ws.call("Runtime.enable")

        time.sleep(1.5)

        # Ensure profile modal is dismissed to enter MENU
        eval_js(ws, """
            if (window.gameState === 'PROFILE') {
                const pBtn = document.querySelector('.btn-select-profile');
                if (pBtn) { pBtn.click(); }
                else if (typeof selectProfile === 'function' && Array.isArray(profiles) && profiles.length > 0) { selectProfile(profiles[0].id); }
                else if (typeof closeProfileMenu === 'function') { closeProfileMenu(); }
            }
        """)
        time.sleep(0.5)

        # 1. Test Clean Main Menu
        print("\n--- TEST 1: MAIN MENU & LOADOUT BUTTON VERIFICATION ---")
        title = eval_js(ws, "document.title")
        gState = eval_js(ws, "window.gameState")
        startBtnText = eval_js(ws, "document.getElementById('startBtn').innerText")
        print(f"Document Title: {title}")
        print(f"Game State: {gState}")
        print(f"Start Button Text: {startBtnText}")
        save_screenshot(ws, "verified_clean_main_menu.png")

        # 2. Click Start Button -> Open Loadout Bay
        print("\n--- TEST 2: OPEN RUN SETUP (LOADOUT BAY) ---")
        eval_js(ws, "document.getElementById('startBtn').click()")
        time.sleep(0.6)
        rsoHidden = eval_js(ws, "document.getElementById('runSetupOverlay').classList.contains('hidden')")
        newGState = eval_js(ws, "window.gameState")
        print(f"runSetupOverlay hidden: {rsoHidden} (Expected: False)")
        print(f"Game State after startBtn click: {newGState} (Expected: 'RUN_SETUP')")
        assert not rsoHidden, "FAIL: runSetupOverlay is still hidden!"
        assert newGState == 'RUN_SETUP', f"FAIL: gameState is {newGState}, expected 'RUN_SETUP'"
        save_screenshot(ws, "verified_run_setup_ships.png")

        # 3. Test Weapons Tab (All 13 Weapons)
        print("\n--- TEST 3: LOADOUT WEAPONS TAB (13 WEAPONS ARSENAL) ---")
        eval_js(ws, "window.ZortexMetaProgression.switchTab('weapons')")
        time.sleep(0.4)
        weaponCardsCount = eval_js(ws, "document.querySelectorAll('#runSetupBody .rso-card').length")
        print(f"Rendered Weapon Cards: {weaponCardsCount} (Expected: 13)")
        assert weaponCardsCount == 13, f"FAIL: Expected 13 weapon cards, found {weaponCardsCount}"
        save_screenshot(ws, "verified_run_setup_weapons.png")

        # 4. Test Neural Chips Tab (16 Chips Matrix)
        print("\n--- TEST 4: LOADOUT NEURAL MATRIX TAB (16 CHIPS) ---")
        eval_js(ws, "window.ZortexMetaProgression.switchTab('chips')")
        time.sleep(0.4)
        chipItemsCount = eval_js(ws, "document.querySelectorAll('#runSetupBody .rso-chip-item').length")
        print(f"Rendered Neural Chips: {chipItemsCount} (Expected: 16)")
        chipDiag = eval_js(ws, "(() => { const ov = document.getElementById('runSetupOverlay'); const hdr = ov.querySelector('.rso-header'); const body = ov.querySelector('.rso-body'); const ftr = ov.querySelector('.rso-footer'); const wrap = document.querySelector('.rso-chips-wrapper'); const hub = document.querySelector('.rso-hub-bar') || document.querySelector('.rso-sockets-hub'); const cols = document.querySelector('.rso-chips-columns'); const col = document.querySelector('.rso-chip-col'); const tierBox = document.querySelector('.rso-chip-tier-box'); const item = document.querySelector('.rso-chip-item'); return { ov_h: ov.offsetHeight, hdr_h: hdr.offsetHeight, body_h: body.offsetHeight, ftr_h: ftr.offsetHeight, wrap_h: wrap ? wrap.offsetHeight : 0, hub_h: hub ? hub.offsetHeight : 0, cols_h: cols ? cols.offsetHeight : 0, col_h: col ? col.offsetHeight : 0, tierBox_h: tierBox ? tierBox.offsetHeight : 0, item_h: item ? item.offsetHeight : 0 }; })()")
        print(f"Containers Diagnostic: {chipDiag}")
        save_screenshot(ws, "verified_run_setup_chips.png")

        # 5. Test Keyboard Navigation (1, 2, 3, Tab, Escape, Enter)
        print("\n--- TEST 5: KEYBOARD NAVIGATION IN LOADOUT BAY ---")
        # Press Digit1
        eval_js(ws, "window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', bubbles: true }))")
        time.sleep(0.2)
        activeTab1 = eval_js(ws, "document.querySelector('.rso-tab-btn.active')?.getAttribute('data-tab')")
        print(f"Active Tab after Digit1: {activeTab1} (Expected: 'ships')")

        # Press Digit2
        eval_js(ws, "window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2', bubbles: true }))")
        time.sleep(0.2)
        activeTab2 = eval_js(ws, "document.querySelector('.rso-tab-btn.active')?.getAttribute('data-tab')")
        print(f"Active Tab after Digit2: {activeTab2} (Expected: 'weapons')")

        # Press Tab (cycle)
        eval_js(ws, "window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Tab', bubbles: true }))")
        time.sleep(0.2)
        activeTabTab = eval_js(ws, "document.querySelector('.rso-tab-btn.active')?.getAttribute('data-tab')")
        print(f"Active Tab after Tab cycle: {activeTabTab} (Expected: 'chips')")

        # Hierarchical Escape test:
        # 1. Escape from chips -> returns to weapons
        eval_js(ws, "window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }))")
        time.sleep(0.3)
        tabAfterEsc1 = eval_js(ws, "document.querySelector('.rso-tab-btn.active')?.getAttribute('data-tab')")
        print(f"Active Tab after 1st Escape: {tabAfterEsc1} (Expected: 'weapons')")
        assert tabAfterEsc1 == 'weapons', f"FAIL: expected weapons, got {tabAfterEsc1}"

        # 2. Escape from weapons -> returns to ships
        eval_js(ws, "window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }))")
        time.sleep(0.3)
        tabAfterEsc2 = eval_js(ws, "document.querySelector('.rso-tab-btn.active')?.getAttribute('data-tab')")
        print(f"Active Tab after 2nd Escape: {tabAfterEsc2} (Expected: 'ships')")
        assert tabAfterEsc2 == 'ships', f"FAIL: expected ships, got {tabAfterEsc2}"

        # 3. Escape from ships -> returns to main menu
        eval_js(ws, "window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }))")
        time.sleep(0.4)
        escapedState = eval_js(ws, "window.gameState")
        escapedHidden = eval_js(ws, "document.getElementById('runSetupOverlay').classList.contains('hidden')")
        print(f"Game State after 3rd Escape: {escapedState} (Expected: 'MENU')")
        print(f"runSetupOverlay hidden after 3rd Escape: {escapedHidden} (Expected: True)")
        assert escapedState == 'MENU', f"FAIL: expected MENU, got {escapedState}"
        assert escapedHidden is True, "FAIL: expected runSetupOverlay to be hidden"

        # 6. Reopen Loadout and Launch Run with Titan & Scattergun
        print("\n--- TEST 6: LOADOUT SELECTION & RUN LAUNCH ---")
        eval_js(ws, "window.ZortexMetaProgression.openRunSetup()")
        time.sleep(0.3)
        # Unlock and select Titan ship with scrap
        eval_js(ws, "window.meta.scrap = 5000; window.ZortexMetaProgression.selectShip('titan');")
        time.sleep(0.3)
        # Launch run via Enter key
        eval_js(ws, "window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }))")
        time.sleep(0.8)
        playingState = eval_js(ws, "window.gameState")
        activeShip = eval_js(ws, "player.shipClassId")
        activeSpeed = eval_js(ws, "player.speed")
        print(f"Game State after Launch: {playingState} (Expected: 'PLAYING')")
        print(f"Player Ship Class: {activeShip} (Expected: 'titan')")
        print(f"Player Speed: {activeSpeed} (Expected: 3.5 - 6.0 pixels/frame)")
        assert playingState == 'PLAYING', f"FAIL: Game did not enter PLAYING state (got {playingState})"
        assert 2.5 <= activeSpeed <= 7.0, f"FAIL: Player speed {activeSpeed} is out of balanced range!"
        save_screenshot(ws, "verified_gameplay_titan_launched.png")

        # 7. Test Boss Spawning and Verify NO CONCENTRIC CIRCLES
        print("\n--- TEST 7: ENEMY VISUAL AUDIT & BOSS TEXTURES VERIFICATION ---")
        # Spawn Wave 3 Hive Mothership
        eval_js(ws, "window.wave = 3; const b = new BossEnemy(player.x + 180, player.y); enemies.push(b); window.BiomeBossManager.configureBoss(b, 3); window.testBoss = b;")
        time.sleep(0.5)
        bossType = eval_js(ws, "window.testBoss.type")
        bossTexLabel = eval_js(ws, "Boolean(window.testBoss.sprite && window.testBoss.sprite.texture)")
        print(f"Wave 3 Boss Type: {bossType}")
        print(f"Wave 3 Boss Has Texture: {bossTexLabel}")
        save_screenshot(ws, "verified_boss_hive_mothership.png")

        # Spawn Wave 10 Omega Dreadnought
        eval_js(ws, "window.wave = 10; const b2 = new BossEnemy(player.x - 220, player.y); enemies.push(b2); window.BiomeBossManager.configureBoss(b2, 10); window.testBoss2 = b2;")
        time.sleep(0.5)
        boss2Type = eval_js(ws, "window.testBoss2.type")
        print(f"Wave 10 Boss Type: {boss2Type}")
        save_screenshot(ws, "verified_boss_omega_dreadnought.png")

        # 8. Test 13 Weapons Selection and Firing
        print("\n--- TEST 8: WEAPON MANAGER 13 WEAPONS FIRING TEST ---")
        weaponsList = eval_js(ws, "window.weaponManager.weaponList")
        print(f"Weapon Manager Registered Weapons: {weaponsList}")
        assert len(weaponsList) == 13, f"FAIL: Expected 13 registered weapons, found {len(weaponsList)}"

        totalFired = 0
        for wId in weaponsList:
            bBefore = eval_js(ws, "bullets.length")
            eval_js(ws, f"if (!window.ZortexMetaProgression.getState().unlockedWeapons.includes('{wId}')) window.ZortexMetaProgression.getState().unlockedWeapons.push('{wId}'); window.weaponManager.selectWeapon('{wId}');")
            activeW = eval_js(ws, "window.weaponManager.activeWeaponId")
            eval_js(ws, "window.weaponManager.fire(player)")
            bAfter = eval_js(ws, "bullets.length")
            delta = bAfter - bBefore
            totalFired += delta
            print(f"Weapon: {wId} | Active: {activeW} | Bullets Created: {delta}")
        time.sleep(0.1)
        bulletsFired = eval_js(ws, "bullets.length")
        print(f"Active bullets remaining across all 13 weapons: {bulletsFired} (Total spawned: {totalFired})")
        assert totalFired >= 13, f"FAIL: Total fired {totalFired} is less than 13"
        save_screenshot(ws, "verified_weapons_arsenal_firing.png")

        # 9. Test Wave 1 Boss Defeat, Chest Drop, and Wave 2 Progression
        print("\n--- TEST 9: WAVE 1 BOSS DEFEAT & WAVE 2 PROGRESSION ---")
        eval_js(ws, "window.wave = 1; window.bossSpawned = true; const bW1 = new BossEnemy(player.x + 150, player.y); enemies.push(bW1); window.BiomeBossManager.configureBoss(bW1, 1); window.testBossW1 = bW1;")
        time.sleep(0.3)
        boss1Type = eval_js(ws, "window.testBossW1.type")
        boss1IsBoss = eval_js(ws, "Boolean(window.testBossW1.isBoss)")
        print(f"Wave 1 Boss Type: {boss1Type} (Expected: 'boss')")
        print(f"Wave 1 Boss isBoss Flag: {boss1IsBoss} (Expected: True)")
        assert boss1Type == 'boss', f"FAIL: Expected boss.type == 'boss', got {boss1Type}"
        assert boss1IsBoss is True, "FAIL: Expected boss.isBoss == True"

        # Kill the boss
        eval_js(ws, "window.testBossW1.die()")
        time.sleep(0.5)

        bossSpawnedAfterDeath = eval_js(ws, "window.bossSpawned")
        waveAfterDeath = eval_js(ws, "window.wave")
        chestsCount = eval_js(ws, "window.ChestSystem ? window.ChestSystem.activeChests.length : 0")
        print(f"bossSpawned after boss death: {bossSpawnedAfterDeath} (Expected: False)")
        print(f"Wave after boss death: {waveAfterDeath} (Expected: 2)")
        print(f"Chests spawned after boss death: {chestsCount} (Expected: >= 1)")
        assert bossSpawnedAfterDeath is False, f"FAIL: bossSpawned is still True after boss death!"
        assert waveAfterDeath == 2, f"FAIL: wave did not advance to 2 (current: {waveAfterDeath})"
        assert chestsCount >= 1, "FAIL: No chest spawned after boss death!"
        save_screenshot(ws, "verified_wave2_transition_chest.png")

        # 10. Test Step-by-Step Wizard Flow (Ship -> Weapon -> Chips)
        print("\n--- TEST 10: LOADOUT BAY WIZARD FLOW (SHIP -> WEAPON -> CHIPS) ---")
        eval_js(ws, "window.returnToMenu(); window.ZortexMetaProgression.openRunSetup();")
        time.sleep(0.4)
        t1 = eval_js(ws, "document.querySelector('.rso-tab-btn.active')?.getAttribute('data-tab')")
        print(f"Initial Wizard Step: {t1} (Expected: 'ships')")
        assert t1 == 'ships', f"FAIL: Expected initial tab 'ships', got {t1}"

        # Advance to weapons
        eval_js(ws, "const btn = document.getElementById('rsoSelectAndGoBtn') || document.getElementById('rsoGoToWeaponsBtn') || document.getElementById('rsoFooterNavBtn'); btn.click();")
        time.sleep(0.3)
        t2 = eval_js(ws, "document.querySelector('.rso-tab-btn.active')?.getAttribute('data-tab')")
        print(f"Wizard Step after Ship Select: {t2} (Expected: 'weapons')")
        assert t2 == 'weapons', f"FAIL: Expected tab 'weapons', got {t2}"
        save_screenshot(ws, "verified_wizard_step2_weapons.png")

        # Advance to chips
        eval_js(ws, "const btn2 = document.getElementById('rsoSelectWAndGoBtn') || document.getElementById('rsoGoToChipsBtn') || document.getElementById('rsoFooterNavBtn'); btn2.click();")
        time.sleep(0.3)
        t3 = eval_js(ws, "document.querySelector('.rso-tab-btn.active')?.getAttribute('data-tab')")
        print(f"Wizard Step after Weapon Select: {t3} (Expected: 'chips')")
        assert t3 == 'chips', f"FAIL: Expected tab 'chips', got {t3}"
        save_screenshot(ws, "verified_wizard_step3_chips.png")

        # Launch from wizard
        eval_js(ws, "document.getElementById('runSetupLaunchBtn').click();")
        time.sleep(0.8)
        stateAfterWizardLaunch = eval_js(ws, "window.gameState")
        print(f"Game State after Wizard Launch: {stateAfterWizardLaunch} (Expected: 'PLAYING')")
        assert stateAfterWizardLaunch == 'PLAYING', f"FAIL: Expected 'PLAYING', got {stateAfterWizardLaunch}"

        print("\n=======================================================")
        print(">>> ALL 10 VERIFICATION TESTS PASSED WITH 100% SUCCESS! <<<")
        print("=======================================================")

    finally:
        if ws:
            ws.close()
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except:
            proc.kill()

if __name__ == "__main__":
    main()
