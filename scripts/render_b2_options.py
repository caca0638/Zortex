import os
import sys
import json
import socket
import threading
import functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

PRELOAD = r"""
(() => {
  let __t = 1000;
  performance.now = () => __t;
  window.__advance = (ms) => { __t += ms; };
  window.__loop = null;
  window.requestAnimationFrame = (cb) => {
    if (typeof cb === 'function' && (cb.name === 'gameLoop' || String(cb).includes('lastFrameExecuteTime'))) { window.__loop = cb; }
    return 1;
  };
})();
"""

RENDER_SCENARIO = r"""
(async () => {
  if (window.gameState === 'PROFILE') {
    const b = document.querySelector('.btn-select-profile'); if (b) b.click();
  }
  if (typeof startGame === 'function') startGame('arcade');
  await new Promise(r => setTimeout(r, 600));

  window.renderB2Mockup = function(option) {
    player.x = 0; player.y = 0; player.angle = -Math.PI * 0.25;
    camX = 0; camY = 0;
    enemies.length = 0;
    
    // Setup test enemies around player
    const e1 = new Enemy('scout', 1); e1.x = -160; e1.y = -100; e1.angle = Math.PI * 0.3; e1.dead = false; enemies.push(e1);
    const e2 = new Enemy('heavy', 1); e2.x = 180; e2.y = -80; e2.angle = Math.PI * 0.8; e2.dead = false; enemies.push(e2);
    const e3 = new Enemy('shooter', 1); e3.x = 120; e3.y = 150; e3.angle = -Math.PI * 0.6; e3.dead = false; enemies.push(e3);

    // Setup Black Hole
    blackHoles.length = 0;
    const bh = new BlackHole(-280, 140); bh.age = 4; bh.spin = 1.8; bh.playerHitCooldown = 999;
    blackHoles.push(bh);

    // Step once to clear and update
    window.__advance(16.667);
    window.__loop(performance.now());

    // Apply Mockup Visual Overlays based on option
    const isSubtle = (option === 'subtle');
    
    // 1. Grid Visual Option
    if (pixiInfiniteGridGraphics) {
      pixiInfiniteGridGraphics.clear();
      const gridAlpha = isSubtle ? 0.02 : 0.07;
      const majorAlpha = isSubtle ? 0.05 : 0.15;
      for (let x = -800; x <= 800; x += 160) {
        const isMajor = (Math.abs(x) % 800 === 0);
        pixiInfiniteGridGraphics.moveTo(x, -600).lineTo(x, 600).stroke({ width: 1.0, color: isMajor ? 0x00f3ff : 0x0284c7, alpha: isMajor ? majorAlpha : gridAlpha });
      }
      for (let y = -600; y <= 600; y += 160) {
        const isMajor = (Math.abs(y) % 800 === 0);
        pixiInfiniteGridGraphics.moveTo(-800, y).lineTo(800, y).stroke({ width: 1.0, color: isMajor ? 0x00f3ff : 0x0284c7, alpha: isMajor ? majorAlpha : gridAlpha });
      }
    }

    // 2. Wingtip Conduits Visual Option
    if (pixiPlayerDetailsGraphics) {
      const cosA = Math.cos(player.angle);
      const sinA = Math.sin(player.angle);
      const noseX = player.x + 18 * cosA;
      const noseY = player.y + 18 * sinA;
      const leftWingX = player.x + (-12 * cosA - (-16) * sinA);
      const leftWingY = player.y + (-12 * sinA + (-16) * cosA);
      const rightWingX = player.x + (-12 * cosA - 16 * sinA);
      const rightWingY = player.y + (-12 * sinA + 16 * cosA);
      
      const conduitAlpha = isSubtle ? 0.45 : 0.85;
      pixiPlayerDetailsGraphics.moveTo(noseX, noseY).lineTo(leftWingX, leftWingY).stroke({ width: 1.6, color: 0x00f3ff, alpha: conduitAlpha });
      pixiPlayerDetailsGraphics.moveTo(noseX, noseY).lineTo(rightWingX, rightWingY).stroke({ width: 1.6, color: 0x00f3ff, alpha: conduitAlpha });
      pixiPlayerDetailsGraphics.circle(leftWingX, leftWingY, 1.8).circle(rightWingX, rightWingY, 1.8).fill({ color: 0xffffff, alpha: isSubtle ? 0.6 : 0.95 });
    }

    // 3. Enemy Reactive Thruster Jets Visual Option
    if (pixiFlameTrailGraphics) {
      const jetAlpha = isSubtle ? 0.45 : 0.85;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const cosA = Math.cos(e.angle);
        const sinA = Math.sin(e.angle);
        const tipX = e.x - cosA * 22;
        const tipY = e.y - sinA * 22;
        pixiFlameTrailGraphics.moveTo(e.x - sinA * 8, e.y + cosA * 8).lineTo(tipX, tipY).stroke({ width: 2.2, color: 0xff3b00, alpha: jetAlpha });
        pixiFlameTrailGraphics.moveTo(e.x + sinA * 8, e.y - cosA * 8).lineTo(tipX, tipY).stroke({ width: 2.2, color: 0xff3b00, alpha: jetAlpha });
      }
    }

    // Render WebGL
    if (window.pixiApp && pixiApp.renderer) {
      pixiApp.render();
    }
  };

  return true;
})()
"""

def main():
    port = free_port()
    handler = functools.partial(Quiet, directory=ROOT)
    srv = ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        br = pw.chromium.launch(headless=True, args=["--use-gl=angle", "--enable-webgl", "--autoplay-policy=no-user-gesture-required"])
        page = br.new_page(viewport={"width": 1280, "height": 720})
        page.add_init_script(PRELOAD)
        page.goto(f"http://127.0.0.1:{port}/index.html")
        page.wait_for_function("typeof startGame === 'function'", timeout=30000)
        page.wait_for_timeout(1000)
        page.evaluate(RENDER_SCENARIO)
        page.wait_for_function("typeof window.renderB2Mockup === 'function'", timeout=10000)
        
        # 1. Option A: Standard (Canlı & Parlak Siber Neon)
        page.evaluate("window.renderB2Mockup('standard')")
        page.screenshot(path=os.path.join(ROOT, "docs", "b2_visual_option_standard.png"))
        
        # 2. Option B: Subtle (Düşük Opaklık & Minimalist Arka Plan)
        page.evaluate("window.renderB2Mockup('subtle')")
        page.screenshot(path=os.path.join(ROOT, "docs", "b2_visual_option_subtle.png"))
        
        br.close()
    srv.shutdown()
    print("B2 Visual Options captured:")
    print("  - docs/b2_visual_option_standard.png")
    print("  - docs/b2_visual_option_subtle.png")

if __name__ == "__main__":
    main()
