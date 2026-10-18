import os
import sys
import time
from playwright.sync_api import sync_playwright

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, "dist", "crazygames_covers")
os.makedirs(OUT_DIR, exist_ok=True)

HTML_URL = f"file:///{os.path.join(REPO_ROOT, 'index.html').replace(os.sep, '/')}"


def record_clip(width, height, output_name, duration_seconds=15):
    print(f"[*] Recording {width}x{height} clip: {output_name} ({duration_seconds}s)...")
    temp_video_dir = os.path.join(OUT_DIR, "temp_video")
    os.makedirs(temp_video_dir, exist_ok=True)

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
        context = browser.new_context(
            record_video_dir=temp_video_dir,
            record_video_size={"width": width, "height": height},
            viewport={"width": width, "height": height}
        )
        page = context.new_page()
        page.goto(HTML_URL)
        page.wait_for_timeout(2500)

        # Start game directly
        page.evaluate("""
            (() => {
                if (typeof loadAllProfiles === 'function') loadAllProfiles();
                if (typeof closeProfileMenu === 'function') closeProfileMenu();
                if (typeof startGame === 'function') startGame();
                // Ensure god mode so player doesn't die during recording
                if (typeof player !== 'undefined' && player) {
                    player.health = 9999;
                    player.maxHealth = 9999;
                    player.shield = 9999;
                    player.maxShield = 9999;
                }
            })();
        """)
        page.wait_for_timeout(1000)

        # Simulate dynamic gameplay (moving mouse in arcs to aim weapon, flying around)
        start_time = time.time()
        step = 0
        cx = width // 2
        cy = height // 2

        while time.time() - start_time < duration_seconds:
            angle = step * 0.25
            target_x = cx + int(180 * (1 + 0.3 * (step % 4)) * (step % 2 * 2 - 1))
            target_y = cy + int(120 * (step % 3 - 1))

            page.mouse.move(target_x, target_y)
            page.mouse.down()

            # WASD key motion
            key = ["KeyW", "KeyD", "KeyS", "KeyA"][step % 4]
            page.keyboard.down(key)
            page.wait_for_timeout(350)
            page.keyboard.up(key)
            page.mouse.up()

            step += 1

        context.close()
        video_path = page.video.path()
        browser.close()

        final_dest = os.path.join(OUT_DIR, output_name)
        if os.path.exists(final_dest):
            os.remove(final_dest)
        os.rename(video_path, final_dest)
        print(f"    [OK] Saved {output_name} -> {os.path.getsize(final_dest)} bytes")


def main():
    # 1. Landscape 16:9 Gameplay Video (1280x720)
    record_clip(1280, 720, "preview_landscape.webm", duration_seconds=15)

    # 2. Portrait Gameplay Video (720x1280)
    record_clip(720, 1280, "preview_portrait.webm", duration_seconds=15)

    # Clean up temp dir if empty
    temp_dir = os.path.join(OUT_DIR, "temp_video")
    if os.path.exists(temp_dir):
        try:
            os.rmdir(temp_dir)
        except Exception:
            pass

    print("\n[SUCCESS] Preview videos recorded successfully in dist/crazygames_covers/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
