"""Per-frame Graphics instruction probe (scratch helper for v7->v8 migration).

Boots the game headless, injects a deterministic scenario that exercises every
per-frame Graphics draw path, steps the real gameLoop, then dumps each
per-frame Graphics object's GPU instruction list (action, style, shapes) as
JSON and takes a screenshot. Running it before and after a migration and
diffing the JSON proves the rendered output is identical.

Usage: python scripts/gfx_probe.py <out_prefix>
"""
import os
import sys
import json
import time
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
  // Deterministic clock & RNG so before/after runs are byte-identical.
  let __t = 1000;
  performance.now = () => __t;
  window.__advance = (ms) => { __t += ms; };
  let seed = 12345;
  Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  window.__reseed = (s) => { seed = s >>> 0; };
  window.__loop = null;
  window.requestAnimationFrame = (cb) => {
    if (typeof cb === 'function' && (cb.name === 'gameLoop' || String(cb).includes('lastFrameExecuteTime'))) { window.__loop = cb; }
    return 1;
  };

  // Intercept generateTexture calls across PixiJS startup
  window.__textureDumps = {};
  const hookRenderer = () => {
    if (!window.PIXI || !window.PIXI.Renderer || !window.PIXI.Renderer.prototype.generateTexture) {
      setTimeout(hookRenderer, 5);
      return;
    }
    const origGT = window.PIXI.Renderer.prototype.generateTexture;
    window.PIXI.Renderer.prototype.generateTexture = function(options) {
      const target = (options && options.target) ? options.target : options;
      const tex = origGT.apply(this, arguments);
      if (target && target.context) {
        tex.__sourceContext = target.context;
      }
      return tex;
    };
  };
  hookRenderer();
})();
"""

SCENARIO = r"""
(() => {
  if (window.gameState === 'PROFILE') {
    const b = document.querySelector('.btn-select-profile'); if (b) b.click();
  }
  if (typeof startGame === 'function') startGame('arcade');
  return true;
})()
"""

SETUP = r"""
(() => {
  const p = player;
  p.x = 0; p.y = 0; p.angle = 0.3; p.health = p.maxHealth = 99999;
  if (enemies.length === 0) {
    ['scout', 'heavy', 'shooter'].forEach((t, i) => {
      const e = new Enemy(t, 1);
      e.x = 200 + i * 70; e.y = -200; e.angle = Math.PI; e.dead = false;
      if (e.sprite) e.sprite.visible = true;
      enemies.push(e);
    });
  }
  // --- hazards below ---
  blackHoles.length = 0;
  const bh = new BlackHole(-260, -120); bh.age = 4; bh.spin = 1.3; bh.playerHitCooldown = 999;
  blackHoles.push(bh);
  activeHackZone = new HackZone(150, 120);
  // --- player effects ---
  p.isDashing = false; p.fireCooldown = 0.1;
  p.ribbonPoints = [];
  for (let i = 0; i < 12; i++) p.ribbonPoints.push({ x: -20 - i * 14, y: -6 - i * 4 + Math.sin(i) * 6, age: i * 0.02, maxAge: 0.35, baseWidth: 9, seed: i });
  p.muzzleFlashes = [
    { type: 'blaster', timer: 0.05, maxTimer: 0.065, color: 0x00f3ff, scale: 1 },
    { type: 'spread', timer: 0.04, maxTimer: 0.065, color: 0xff8800, scale: 1 },
    { type: 'plasma_beam', timer: 0.05, maxTimer: 0.065, color: 0xd946ef, scale: 1 },
    { type: 'railgun', timer: 0.05, maxTimer: 0.065, color: 0x00f3ff, scale: 1 },
  ];
  p.shieldImpactTimer = 0.2;
  p.orbitalShields = [{ x: 70, y: 0, dist: 70, radius: 12 }, { x: -70, y: 0, dist: 70, radius: 12 }];
  flameTrails.length = 0;
  flameTrails.push({ x: -60, y: 40, life: 0.3, maxLife: 0.45, radius: 28, seed: 1, dashAngle: 0.3 });
  flameTrails.push({ x: -90, y: 55, life: 0.2, maxLife: 0.45, radius: 24, seed: 2 });
  if (typeof shockwaves !== 'undefined') { shockwaves.length = 0; shockwaves.push({ x: 120, y: -90, life: 0.5, duration: 0.6, maxRadius: 90, lineWidth: 6, color: 0xff3366 }); }
  if (typeof lightningArcs !== 'undefined') { lightningArcs.length = 0; const a = (typeof makeLightningArc === 'function') ? makeLightningArc(30, 30, 160, 60) : { x1: 30, y1: 30, x2: 160, y2: 60, points: [{ x: 80, y: 20 }, { x: 120, y: 70 }] }; a.life = 5; a.alpha = 0.8; lightningArcs.push(a); }
  if (typeof bossLasers !== 'undefined') { bossLasers.length = 0; }
  return true;
})()
"""

# Spawn a few normal enemies with visible sprites so enemy thruster plumes run.
SPAWN = r"""
(() => {
  const types = ['scout', 'heavy', 'shooter'];
  const out = [];
  if (typeof Enemy === 'function') {
    types.forEach((t, i) => {
      try {
        const e = new Enemy(t, 1);
        e.x = 200 + i * 70; e.y = -200; e.angle = Math.PI; e.dead = false;
        if (e.sprite) e.sprite.visible = true;
        enemies.push(e); out.push(t);
      } catch (err) { out.push(t + ':ERR ' + err.message); }
    });
  }
  return out;
})()
"""

DUMP = r"""
(() => {
  const names = ['pixiInfiniteGridGraphics','pixiHazardsBelow','pixiPlayerThrusters','pixiPlayerDetailsGraphics',
                 'pixiFluidRibbonGraphics','pixiFlameTrailGraphics','pixiHazardsAbove','pixiCustomEnemiesGraphics'];
  const r6 = (v) => (typeof v === 'number') ? Math.round(v * 1e4) / 1e4 : v;
  const shapeSig = (sp) => {
    const s = sp.shape; const o = { t: s.type };
    ['x','y','radius','width','height','halfWidth','halfHeight'].forEach(k => { if (s[k] !== undefined) o[k] = r6(s[k]); });
    if (s.points) o.pts = s.points.map(r6);
    if (s.closePath !== undefined) o.closed = s.closePath;
    return o;
  };
  const res = {};
  for (const n of names) {
    let g; try { g = eval(n); } catch (e) { g = null; }
    if (!g || !g.context) { res[n] = null; continue; }
    const ins = [];
    for (const it of g.context.instructions) {
      const d = it.data;
      const shapes = (d.path && d.path.shapePath) ? d.path.shapePath.shapePrimitives.map(shapeSig) : [];
      if (shapes.length === 0) continue;  // empty-path instructions render nothing
      const st = d.style || {};
      const o = { a: it.action, color: st.color, alpha: r6(st.alpha), shapes };
      if (it.action === 'stroke') { o.width = r6(st.width); o.alignment = st.alignment; o.cap = st.cap; o.join = st.join; }
      ins.push(o);
    }
    res[n] = ins;
  }
  return res;
})()
"""


DUMP_TEXTURES = r"""
(() => {
  const r6 = (v) => (typeof v === 'number') ? Math.round(v * 1e4) / 1e4 : v;
  const shapeSig = (sp) => {
    const s = sp.shape; const o = { t: s.type };
    ['x','y','radius','width','height','halfWidth','halfHeight'].forEach(k => { if (s[k] !== undefined) o[k] = r6(s[k]); });
    if (s.points) o.pts = s.points.map(r6);
    if (s.closePath !== undefined) o.closed = s.closePath;
    return o;
  };
  const dumpGfx = (ctx) => {
    if (!ctx || !ctx.instructions) return [];
    const ins = [];
    for (const it of ctx.instructions) {
      const d = it.data;
      const shapes = (d.path && d.path.shapePath) ? d.path.shapePath.shapePrimitives.map(shapeSig) : [];
      if (shapes.length === 0) continue;
      const st = d.style || {};
      const o = { a: it.action, color: st.color, alpha: r6(st.alpha), shapes };
      if (it.action === 'stroke') { o.width = r6(st.width); o.alignment = st.alignment; o.cap = st.cap; o.join = st.join; }
      ins.push(o);
    }
    return ins;
  };
  const res = {};
  if (window.pixiTextures) {
    for (const [k, tex] of Object.entries(window.pixiTextures)) {
      if (tex && tex.__sourceContext) {
        res[k] = dumpGfx(tex.__sourceContext);
      }
    }
  }
  return res;
})()
"""


def main():
    prefix = sys.argv[1] if len(sys.argv) > 1 else os.path.join("docs", "probe")
    port = free_port()
    handler = functools.partial(Quiet, directory=ROOT)
    srv = ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    from playwright.sync_api import sync_playwright
    errors = []
    with sync_playwright() as pw:
        br = pw.chromium.launch(headless=True, args=["--use-gl=angle", "--enable-webgl", "--autoplay-policy=no-user-gesture-required"])
        page = br.new_page(viewport={"width": 1280, "height": 720})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append("console." + m.type + ": " + m.text) if m.type in ("error", "warning") else None)
        page.add_init_script(PRELOAD)
        page.goto(f"http://127.0.0.1:{port}/index.html")
        page.wait_for_function("typeof startGame === 'function'", timeout=30000)
        page.wait_for_timeout(1500)
        page.evaluate(SCENARIO)
        page.wait_for_function("window.__loop !== null", timeout=10000)
        # warm-up frames so systems initialise
        for _ in range(10):
            page.evaluate("(() => { __advance(16.667); __loop(performance.now()); })()")
        spawned = page.evaluate(SPAWN)
        page.evaluate(SETUP)
        page.evaluate("__reseed(777)")
        # Two frames: the 2nd one shows any cross-frame style leakage too.
        for _ in range(2):
            page.evaluate(SETUP)
            page.evaluate("__reseed(777)")
            page.evaluate("(() => { gameState = 'PLAYING'; __advance(16.667); __loop(performance.now()); })()")
        dump = page.evaluate(DUMP)
        out_json = os.path.join(ROOT, f"{prefix}.json")
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(dump, f, indent=1, sort_keys=True)
        
        # Trigger texture generation to capture source Graphics instructions
        page.evaluate(r"""(() => {
          const origGen = pixiApp.renderer.generateTexture.bind(pixiApp.renderer);
          pixiApp.renderer.generateTexture = function(opts) {
            const target = (opts && opts.target) ? opts.target : opts;
            const res = origGen(opts);
            if (target && target.context) {
              res.__sourceContext = target.context;
            }
            return res;
          };
          initPixiTextures(pixiApp);
          if (window.customEnemyRegistry && typeof window.customEnemyRegistry.initTextures === 'function') {
            window.customEnemyRegistry.initTextures(pixiApp);
          }
          return true;
        })()""")

        # Dump textures instructions
        tex_dump = page.evaluate(DUMP_TEXTURES)
        tex_json = os.path.join(ROOT, f"{prefix}_textures.json")
        with open(tex_json, "w", encoding="utf-8") as f:
            json.dump(tex_dump, f, indent=1, sort_keys=True)
            
        page.screenshot(path=os.path.join(ROOT, f"{prefix}.png"))
        br.close()
    srv.shutdown()
    print("spawned:", spawned)
    for k, v in dump.items():
        print(f"{k:28} {str(len(v)) + ' instr' if isinstance(v, list) else v}")
    print(f"\n--- Captured Textures: {len(tex_dump)} total ---")
    for k, v in sorted(tex_dump.items()):
        print(f"  tex: {k:26} {len(v)} instr")
    print("page errors:", len(errors))
    for e in errors[:15]:
        print("  ", e[:200])


if __name__ == "__main__":
    main()

