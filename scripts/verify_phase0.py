import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def run_phase0_test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--use-gl=angle',
                '--use-angle=d3d11',
                '--enable-webgl',
                '--enable-webgl2',
                '--ignore-gpu-blocklist',
                '--no-sandbox'
            ]
        )
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})

        console_errors = []
        console_warnings = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else (console_warnings.append(msg.text) if msg.type == 'warning' else None))

        url = "http://127.0.0.1:8080/index.html"
        print(f"Loading {url}...")
        await page.goto(url, wait_until='networkidle')
        await asyncio.sleep(2.0)

        # Check ZortexFX globals
        fx_status = await page.evaluate("""
            () => {
                return {
                    hasZortexFX: !!window.ZortexFX,
                    currentTier: window.ZortexFX ? window.ZortexFX.quality.currentTier : null,
                    hasTweakpane: !!window.Tweakpane,
                    hasPixiFilters: !!window.PIXI_FILTERS,
                    hasAdvancedBloom: !!(window.PIXI_FILTERS && window.PIXI_FILTERS.AdvancedBloomFilter),
                    hudText: document.getElementById('zortex-fx-stats') ? document.getElementById('zortex-fx-stats').innerText : null
                };
            }
        """)
        print("FX Status:", fx_status)

        # Start game
        await page.evaluate("""
            () => {
                const profileOverlay = document.getElementById('profileSelectOverlay');
                if (profileOverlay) profileOverlay.classList.add('hidden');
                const startBtn = document.getElementById('btnStart');
                if (startBtn) startBtn.click();
            }
        """)
        await asyncio.sleep(3.0)

        # Get metrics during play
        metrics = await page.evaluate("""
            () => {
                return {
                    fps: window.fpsSmoothed || 0,
                    enemies: (window.enemies || []).length,
                    bullets: (window.bullets || []).length,
                    hudText: document.getElementById('zortex-fx-stats') ? document.getElementById('zortex-fx-stats').innerText : null
                };
            }
        """)
        print("Metrics during play:", metrics)

        # Toggle Tweakpane with F2
        await page.keyboard.press("F2")
        await asyncio.sleep(1.0)
        tweakpane_visible = await page.evaluate("""
            () => {
                return window.ZortexFX && window.ZortexFX.debug.isVisible;
            }
        """)
        print("Tweakpane visible after F2:", tweakpane_visible)

        # Screenshot
        out_shot = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\phase0_verification.png"
        await page.screenshot(path=out_shot)
        print(f"Screenshot saved to {out_shot}")

        print("Console errors count:", len(console_errors))
        if console_errors:
            print("Errors:", console_errors)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_phase0_test())
