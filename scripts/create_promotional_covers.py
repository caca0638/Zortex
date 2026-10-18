"""
=============================================================================
  ZORTEX: PROFESSIONAL PUBLICATION COVER ART GENERATOR (PLAYWRIGHT)
=============================================================================
Captures high-resolution, branded cover artwork directly from the real PixiJS v8
engine for CrazyGames, Steam, itch.io, and YouTube:
  1. Landscape 16:9 (1920x1080) - Main Banner & Capsule
  2. Portrait 2:3   (800x1200)  - Storefront Poster & Mobile Capsule
  3. Square 1:1     (800x800)   - Square Icon & Social Media Showcase
=============================================================================
"""

import os
import sys
import time
from PIL import Image
from playwright.sync_api import sync_playwright

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, "dist", "crazygames_covers")
os.makedirs(OUT_DIR, exist_ok=True)

HTML_URL = f"file:///{os.path.join(REPO_ROOT, 'index.html').replace(os.sep, '/')}"


def capture_format(page, width, height, filename, logo_scale=1.3, logo_top=70, logo_left=70, center_logo=False, planet_x=None, planet_y=None, ship_x=None, ship_y=None):
    print(f"[*] Setting viewport {width}x{height} for {filename}...")
    page.set_viewport_size({"width": width, "height": height})
    page.wait_for_timeout(1000)

    # Style UI: Ensure menuOverlay + menuShowcaseCanvas are fully visible, glowing cyber logo is placed, and buttons/HUD are hidden
    setup_script = f"""
    (() => {{
        window.gameState = 'MENU';

        // Ensure menuOverlay is active and full-screen
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) {{
            menuOverlay.classList.remove('hidden');
            menuOverlay.style.display = 'block';
            menuOverlay.style.position = 'fixed';
            menuOverlay.style.top = '0';
            menuOverlay.style.left = '0';
            menuOverlay.style.width = '100vw';
            menuOverlay.style.height = '100vh';
            menuOverlay.style.background = '#030712';
            menuOverlay.style.zIndex = '100';
        }}

        // Ensure canvas matches screen and redraws
        const canvas = document.getElementById('menuShowcaseCanvas');
        if (canvas) {{
            canvas.style.display = 'block';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '1';
        }}

        if (window.ZortexMenuShowcase) {{
            if (typeof window.ZortexMenuShowcase.handleResize === 'function') {{
                window.ZortexMenuShowcase.handleResize();
            }}
            {'window.ZortexMenuShowcase.planetX = ' + str(planet_x) + ';' if planet_x is not None else ''}
            {'window.ZortexMenuShowcase.planetY = ' + str(planet_y) + ';' if planet_y is not None else ''}
            {'window.ZortexMenuShowcase.customShipX = ' + str(ship_x) + ';' if ship_x is not None else ''}
            {'window.ZortexMenuShowcase.customShipY = ' + str(ship_y) + ';' if ship_y is not None else ''}
        }}

        // Style main menu panel: transparent dock, keep ONLY the brand logo
        const panel = document.getElementById('mainMenuPanel');
        if (panel) {{
            panel.style.display = 'block';
            panel.style.position = 'absolute';
            panel.style.top = '0';
            panel.style.left = '0';
            panel.style.width = '100%';
            panel.style.height = '100%';
            panel.style.background = 'transparent';
            panel.style.boxShadow = 'none';
            panel.style.border = 'none';
            panel.style.clipPath = 'none';
            panel.style.backdropFilter = 'none';
            panel.style.webkitBackdropFilter = 'none';
            panel.style.padding = '0';
            panel.style.margin = '0';
            panel.style.zIndex = '200';
            panel.style.pointerEvents = 'none';

            // Hide everything in the panel except the brand logo
            panel.querySelectorAll(':scope > *:not(.brand-logo-container)').forEach(el => {{
                el.style.display = 'none';
            }});

            const logo = panel.querySelector('.brand-logo-container');
            if (logo) {{
                logo.style.position = 'absolute';
                if ({str(center_logo).lower()}) {{
                    logo.style.top = '{logo_top}px';
                    logo.style.left = '50%';
                    logo.style.transform = 'translateX(-50%) scale({logo_scale})';
                    logo.style.transformOrigin = 'top center';
                }} else {{
                    logo.style.top = '{logo_top}px';
                    logo.style.left = '{logo_left}px';
                    logo.style.transform = 'scale({logo_scale})';
                    logo.style.transformOrigin = 'top left';
                }}
            }}
        }}

        // Hide profile overlay and all other overlays
        document.querySelectorAll('.overlay, .profile-modal-overlay, #runSetupOverlay, #optionsOverlay, #profileOverlay').forEach(el => {{
            if (el.id !== 'menuOverlay') {{
                el.classList.add('hidden');
                el.style.display = 'none';
            }}
        }});

        // Hide gameplay HUD
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'none';
        document.querySelectorAll('.hud-top-left, .hud-top-center, .hud-top-right, .hud-bottom-left, .hud-bottom-center, .hud-bottom-right').forEach(el => {{
            el.style.display = 'none';
        }});

        window.dispatchEvent(new Event('resize'));
    }})();
    """
    page.evaluate(setup_script)
    page.wait_for_timeout(3000)  # Allow multiple frames of particles, planet rotation and thruster glow

    dest_path = os.path.join(OUT_DIR, filename)
    page.screenshot(path=dest_path)

    im = Image.open(dest_path)
    print(f"    [OK] Captured {filename} -> Size: {im.size}, Mode: {im.mode}, Bytes: {os.path.getsize(dest_path)}")
    return dest_path


def main():
    print("[*] Launching Playwright Chromium...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--hide-scrollbars",
                "--mute-audio",
                "--enable-webgl",
                "--ignore-gpu-blocklist",
                "--use-gl=angle"
            ]
        )
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        print(f"[*] Navigating to {HTML_URL}...")
        page.goto(HTML_URL)
        page.wait_for_timeout(3000)  # Let PixiJS and showcase initialize

        # Set up initial profile if missing and switch to MENU state
        page.evaluate("""
            (() => {
                if (typeof loadAllProfiles === 'function') loadAllProfiles();
                if (typeof closeProfileMenu === 'function') closeProfileMenu();
                window.gameState = 'MENU';
                const po = document.getElementById('profileOverlay');
                if (po) { po.classList.add('hidden'); po.style.display = 'none'; }
                const mo = document.getElementById('menuOverlay');
                if (mo) { mo.classList.remove('hidden'); mo.style.display = 'block'; }
            })();
        """)
        page.wait_for_timeout(2000)

        # 1. Landscape 16:9 (1920x1080)
        # CrazyGames has an obscured label zone in top-left (x: 0-600, y: 0-220)
        # Placing logo safely below the label zone at middle-left: top=380px, left=120px
        # Ship is on the right at x=1260, y=580; Planet is at x=1540, y=340
        capture_format(
            page, 1920, 1080, "cover_landscape_1920x1080.png",
            logo_scale=1.45, logo_top=380, logo_left=120, center_logo=False,
            planet_x=1540, planet_y=340, ship_x=1260, ship_y=580
        )

        # 2. Portrait 2:3 (800x1200)
        # In 800x1200: Logo top center (scale 1.22, top 70)
        # Planet in upper-right half (x=520, y=480)
        # Ship in lower-center (x=400, y=860)
        capture_format(
            page, 800, 1200, "cover_portrait_800x1200.png",
            logo_scale=1.22, logo_top=70, center_logo=True,
            planet_x=520, planet_y=480, ship_x=400, ship_y=860
        )

        # 3. Square 1:1 (800x800)
        # In 800x800: Logo top center (scale 1.15, top 40)
        # Planet in upper-right (x=640, y=300)
        # Ship in center-left (x=360, y=560)
        capture_format(
            page, 800, 800, "cover_square_800x800.png",
            logo_scale=1.15, logo_top=40, center_logo=True,
            planet_x=640, planet_y=300, ship_x=360, ship_y=560
        )

        browser.close()

    print("\n=======================================================")
    print(">>> ALL 3 CRAZYGAMES COVERS GENERATED IN dist/crazygames_covers/ <<<")
    print("=======================================================")
    return 0


if __name__ == "__main__":
    sys.exit(main())
