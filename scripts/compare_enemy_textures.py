# -*- coding: utf-8 -*-
"""
scripts/compare_enemy_textures.py

Utility to inspect texture resolution, pixel dimensions, and capture screenshots.
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

def inspect_textures(capture_prefix=None):
    httpd = socketserver.TCPServer(('127.0.0.1', 0), QuietHandler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto(f"http://127.0.0.1:{port}/index.html")
        page.wait_for_function("typeof window.pixiTextures !== 'undefined' && window.pixiTextures.enemy_sniper")

        # Query texture details
        details = page.evaluate("""() => {
            const keys = [
                'enemy_scout',
                'enemy_sniper',
                'enemy_shield_linker',
                'enemy_carrier',
                'enemy_siphon',
                'enemy_boss_turret'
            ];
            const result = {};
            for (const k of keys) {
                const tex = window.pixiTextures[k];
                if (!tex) {
                    result[k] = null;
                    continue;
                }
                const src = tex.source || {};
                result[k] = {
                    key: k,
                    resolution: src.resolution,
                    width: tex.width,
                    height: tex.height,
                    pixelWidth: src.pixelWidth || (tex.width * (src.resolution || 1)),
                    pixelHeight: src.pixelHeight || (tex.height * (src.resolution || 1)),
                    antialias: src.antialias !== undefined ? src.antialias : null,
                    scaleMode: src.scaleMode || null
                };
            }
            return result;
        }""")

        print(json.dumps(details, indent=2))

        # If capture_prefix specified, render comparison cards for each of the 5 enemies
        if capture_prefix:
            artifacts_dir = os.path.join(REPO_ROOT, "docs")
            os.makedirs(artifacts_dir, exist_ok=True)

            page.evaluate("""(keys) => {
                // Create a clean overlay container to display the sprites at 3x zoom
                const overlay = document.createElement('div');
                overlay.id = 'texture-preview-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100vw';
                overlay.style.height = '100vh';
                overlay.style.backgroundColor = '#0b0f19';
                overlay.style.zIndex = '999999';
                overlay.style.display = 'flex';
                overlay.style.flexWrap = 'wrap';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.gap = '24px';
                overlay.style.padding = '20px';
                overlay.style.boxSizing = 'border-box';
                overlay.style.fontFamily = 'monospace';
                overlay.style.color = '#fff';

                document.body.appendChild(overlay);

                // Use Pixi app to extract each sprite as canvas/image
                const app = window.pixiApp;
                for (const k of keys) {
                    const tex = window.pixiTextures[k];
                    if (!tex) continue;

                    const card = document.createElement('div');
                    card.id = 'card-' + k;
                    card.style.background = '#161e2e';
                    card.style.border = '1px solid #374151';
                    card.style.borderRadius = '8px';
                    card.style.padding = '16px';
                    card.style.textAlign = 'center';
                    card.style.width = '200px';

                    const title = document.createElement('div');
                    title.textContent = k;
                    title.style.fontWeight = 'bold';
                    title.style.marginBottom = '8px';
                    title.style.color = '#38bdf8';
                    card.appendChild(title);

                    const meta = document.createElement('div');
                    const src = tex.source || {};
                    const res = src.resolution || 1;
                    const pw = src.pixelWidth || (tex.width * res);
                    const ph = src.pixelHeight || (tex.height * res);
                    meta.textContent = `res: ${res}x | ${pw}x${ph}px`;
                    meta.style.fontSize = '12px';
                    meta.style.color = '#9ca3af';
                    meta.style.marginBottom = '12px';
                    card.appendChild(meta);

                    // Render texture to canvas using app.renderer.extract.canvas
                    try {
                        const spr = new PIXI.Sprite(tex);
                        spr.anchor.set(0.5);
                        spr.x = tex.width;
                        spr.y = tex.height;
                        const cont = new PIXI.Container();
                        cont.addChild(spr);

                        const canvas = app.renderer.extract.canvas(spr);
                        canvas.style.width = (tex.width * 2.5) + 'px';
                        canvas.style.height = (tex.height * 2.5) + 'px';
                        canvas.style.imageRendering = 'auto'; // show filtered/antialiased result
                        canvas.style.border = '1px dashed #4b5563';
                        canvas.style.background = '#030712';
                        card.appendChild(canvas);
                    } catch (e) {
                        const err = document.createElement('div');
                        err.textContent = 'Render error: ' + e.message;
                        card.appendChild(err);
                    }

                    overlay.appendChild(card);
                }
            }""", [
                'enemy_scout',
                'enemy_sniper',
                'enemy_shield_linker',
                'enemy_carrier',
                'enemy_siphon',
                'enemy_boss_turret'
            ])

            # Take full screenshot
            out_path = os.path.join(artifacts_dir, f"{capture_prefix}_enemies_preview.png")
            page.screenshot(path=out_path)
            print(f"[+] Saved comparison preview to: {out_path}")

            # Also take individual cards screenshot
            for k in ['enemy_sniper', 'enemy_shield_linker', 'enemy_carrier', 'enemy_siphon', 'enemy_boss_turret']:
                card_el = page.query_selector(f"#card-{k}")
                if card_el:
                    card_path = os.path.join(artifacts_dir, f"{capture_prefix}_{k}.png")
                    card_el.screenshot(path=card_path)
                    print(f"  [+] Saved {k} screenshot: {card_path}")

        browser.close()

    httpd.shutdown()

if __name__ == "__main__":
    prefix = sys.argv[1] if len(sys.argv) > 1 else None
    inspect_textures(prefix)
