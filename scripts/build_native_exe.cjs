/**
 * =============================================================================
 * ZORTEX: CYBER SURVIVOR - NATIVE EXE & DISTRIBUTION BUILDER
 * =============================================================================
 * Builds:
 *   1. Native Windows Executable in dist/win-unpacked/Zortex.exe
 *      (with custom icon & version metadata embedded via rcedit)
 *   2. Runs an automated self-test inside Zortex.exe
 * =============================================================================
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { rcedit } = require('rcedit');

const ROOT = path.resolve(__dirname, '..');
const EXE_PATH = path.join(ROOT, 'dist', 'win-unpacked', 'Zortex.exe');
const ICON_PATH = path.join(ROOT, 'desktop', 'icons', 'icon.ico');

async function main() {
  console.log('==============================================================');
  console.log('  [1/4] Generating High-DPI Native Application Icons...');
  console.log('==============================================================');
  execSync('python scripts/generate_app_icon.py', { cwd: ROOT, stdio: 'inherit' });

  console.log('\n==============================================================');
  console.log('  [2/4] Packaging Native Windows Executable (electron-builder)');
  console.log('==============================================================');
  execSync('npx electron-builder --win dir', { cwd: ROOT, stdio: 'inherit' });

  console.log('\n==============================================================');
  console.log('  [3/4] Embedding Custom Mecha Icon & PE Metadata (rcedit)...');
  console.log('==============================================================');
  if (!fs.existsSync(EXE_PATH)) {
    throw new Error(`Expected executable not found at: ${EXE_PATH}`);
  }
  await rcedit(EXE_PATH, {
    icon: ICON_PATH,
    'version-string': {
      ProductName: 'Zortex: Cyber Survivor',
      FileDescription: 'Zortex: Cyber Survivor - 2D Cyberpunk Rogue-Lite',
      CompanyName: 'ZORTEX Team',
      LegalCopyright: 'Copyright (C) 2026 ZORTEX Team'
    },
    'file-version': '2.5.0',
    'product-version': '2.5.0'
  });
  console.log('  [OK] Custom Icon & Version Metadata embedded into Zortex.exe');

  console.log('\n==============================================================');
  console.log('  [4/4] Running Self-Test Probe on Built Zortex.exe...');
  console.log('==============================================================');
  const out = execSync(`"${EXE_PATH}" --verify-exe`, { cwd: ROOT, encoding: 'utf8' });
  console.log(out.trim());
  if (!out.includes('[ZORTEX_EXE_VERIFY_PASS]')) {
    throw new Error('Zortex.exe self-verification failed!');
  }

  console.log('\n==============================================================');
  console.log('  BUILD COMPLETE: dist/win-unpacked/Zortex.exe IS READY!');
  console.log('==============================================================');
}

main().catch(err => {
  console.error('[BUILD ERROR]', err);
  process.exit(1);
});
