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

SETUP_BH = r"""
(() => {
  if (window.gameState === 'PROFILE') {
    const b = document.querySelector('.btn-select-profile'); if (b) b.click();
  }
  if (typeof startGame === 'function') startGame('arcade');
  
  player.x = 200; player.y = 0; player.health = player.maxHealth = 99999;
  camX = 0; camY = 0;
  enemies.length = 0;
  blackHoles.length = 0;
  
  const bh = new BlackHole(0, 0);
  bh.age = 4.5;
  bh.spin = 2.1;
  bh.playerHitCooldown = 999;
  blackHoles.push(bh);
  
  if (typeof activeHackZone !== 'undefined') activeHackZone = null;
  return true;
})()
"""

# Native Doppler Disk renderer injection: draws relativistic accretion disk properly per color segment
DOPPLER_RENDERER = r"""
(() => {
  window.__drawBlackHoleDoppler = function(bh) {
    const s = bh.scale;
    if (s <= 0) return;
    const coreR = bh.coreRadius;
    const pullR = bh.pullRadius;
    const spin = bh.spin || 0;

    // 1. Radar Boundary
    pixiHazardsBelow.circle(bh.x, bh.y, pullR).stroke({ width: 1.6, color: 0x00f3ff, alpha: 0.40 * s });
    for (let seg = 0; seg < 12; seg++) {
      const a1 = (seg * Math.PI * 2) / 12 + spin * 0.2;
      const a2 = a1 + 0.18;
      pixiHazardsBelow.moveTo(bh.x + Math.cos(a1) * pullR, bh.y + Math.sin(a1) * pullR)
        .lineTo(bh.x + Math.cos(a2) * pullR, bh.y + Math.sin(a2) * pullR)
        .stroke({ width: 2.4, color: 0x00f3ff, alpha: 0.65 * s });
    }

    // 2. Gravitational Corona Gradients
    pixiHazardsBelow.circle(bh.x, bh.y, pullR * 0.92).fill({ color: 0x1e1b4b, alpha: 0.08 * s });
    pixiHazardsBelow.circle(bh.x, bh.y, pullR * 0.68).fill({ color: 0x3b0764, alpha: 0.14 * s });
    pixiHazardsBelow.circle(bh.x, bh.y, pullR * 0.44).fill({ color: 0x581c87, alpha: 0.20 * s });
    pixiHazardsBelow.circle(bh.x, bh.y, pullR * 0.26).fill({ color: 0x7e22ce, alpha: 0.26 * s });

    // 3. True Relativistic Accretion Disk (Doppler beaming)
    const arms = 8;
    for (let arm = 0; arm < arms; arm++) {
      const armAngle = spin * 2.4 + (arm * Math.PI * 2) / arms;
      const steps = 14;
      for (let st = 0; st < steps; st++) {
        const frac1 = st / steps;
        const frac2 = (st + 1) / steps;
        const r1 = coreR * 1.15 + frac1 * (pullR * 0.75 - coreR);
        const r2 = coreR * 1.15 + frac2 * (pullR * 0.75 - coreR);
        const a1 = armAngle - frac1 * 3.2;
        const a2 = armAngle - frac2 * 3.2;

        const doppler = Math.cos(a1 - spin);
        let col = 0xc084fc, alpha = 0.50 * s, w = 2.0;
        if (doppler > 0.35) {
          col = 0xffffff; alpha = 0.95 * s; w = 3.8;
        } else if (doppler > -0.15) {
          col = 0xf59e0b; alpha = 0.82 * s; w = 2.8;
        } else {
          col = 0x6366f1; alpha = 0.40 * s; w = 1.8;
        }

        pixiHazardsBelow.moveTo(bh.x + Math.cos(a1) * r1, bh.y + Math.sin(a1) * r1)
          .lineTo(bh.x + Math.cos(a2) * r2, bh.y + Math.sin(a2) * r2)
          .stroke({ width: w, color: col, alpha: alpha });
      }
    }

    // 4. Inflowing streaks
    for (let st = 0; st < 12; st++) {
      const sAng = spin * 3.6 + (st * Math.PI * 2) / 12;
      const inR = coreR * 1.35 + ((st * 20) % (pullR * 0.50));
      pixiHazardsBelow.moveTo(bh.x + Math.cos(sAng) * inR, bh.y + Math.sin(sAng) * inR)
        .lineTo(bh.x + Math.cos(sAng + 0.16) * (inR * 0.82), bh.y + Math.sin(sAng + 0.16) * (inR * 0.82))
        .stroke({ width: 2.0, color: 0xffffff, alpha: 0.80 * s });
    }

    // 5. Relativistic Photon Sphere Ring
    pixiHazardsBelow.circle(bh.x, bh.y, coreR * 1.34).stroke({ width: 3.4, color: 0xd946ef, alpha: 0.95 * s });
    pixiHazardsBelow.circle(bh.x, bh.y, coreR * 1.12).stroke({ width: 2.2, color: 0xffffff, alpha: 1.0 * s });

    // 6. Singularity Event Horizon
    pixiHazardsBelow.circle(bh.x, bh.y, coreR)
      .fill({ color: 0x000000, alpha: 1.0 })
      .stroke({ width: 2.4, color: 0x9333ea, alpha: 0.95 * s });
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
        page.evaluate(SETUP_BH)
        page.wait_for_function("window.__loop !== null", timeout=10000)
        
        # Step 1: Render with CURRENT single-color spiral (current behavior)
        for _ in range(5):
            page.evaluate("(() => { __advance(16.667); __loop(performance.now()); })()")
        current_shot = os.path.join(ROOT, "docs", "blackhole_current_monochrome.png")
        page.screenshot(path=current_shot)
        print("Captured docs/blackhole_current_monochrome.png")
        
        # Step 2: Inject Doppler accretion disk override in place of blackhole loop in pixiHazardsBelow
        page.evaluate(DOPPLER_RENDERER)
        page.evaluate(r"""(() => {
          // Hook after pixiHazardsBelow draws
          window.__origLoop = window.__loop;
          window.__loop = (t) => {
            window.__origLoop(t);
            // Redraw blackholes cleanly with Doppler disk
            if (pixiHazardsBelow && blackHoles.length > 0) {
              pixiHazardsBelow.clear();
              blackHoles.forEach(bh => window.__drawBlackHoleDoppler(bh));
            }
          };
        })()""")
        for _ in range(5):
            page.evaluate("(() => { __advance(16.667); __loop(performance.now()); })()")
        doppler_shot = os.path.join(ROOT, "docs", "blackhole_option_doppler.png")
        page.screenshot(path=doppler_shot)
        print("Captured docs/blackhole_option_doppler.png")
        
        br.close()
    srv.shutdown()
    print("Done generating comparison screenshots.")

if __name__ == "__main__":
    main()
