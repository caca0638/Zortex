"""
=============================================================================
  ZORTEX: CYBER SURVIVOR - ITCH.IO & CRAZYGAMES DISTRIBUTION PACKAGER
=============================================================================
Produces clean, publication-ready archives in dist/:
  1. dist/Zortex-Windows-v2.5.0.zip  (Native Windows .exe + runtime for itch.io)
  2. dist/Zortex-Web-HTML5-v2.5.0.zip (Pure HTML5/WebGL bundle for itch.io & CrazyGames)
=============================================================================
"""

import os
import zipfile

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, "dist")
UNPACKED_DIR = os.path.join(DIST_DIR, "win-unpacked")

WEB_INCLUDES = [
    "index.html",
    "pixi.v8.min.js",
    "js",
    "vendor",
    "assets",
]


def zip_directory(src_dir, zip_path):
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for root, _, files in os.walk(src_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, src_dir)
                zf.write(full_path, rel_path)


def build_web_zip(zip_path):
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for item in WEB_INCLUDES:
            target = os.path.join(ROOT_DIR, item)
            if os.path.isfile(target):
                zf.write(target, item)
            elif os.path.isdir(target):
                for root, _, files in os.walk(target):
                    # Skip internal node/npm build packages inside vendor
                    parts = root.split(os.sep)
                    if "package" in parts:
                        continue
                    for file in files:
                        ext = os.path.splitext(file)[1].lower()
                        if ext in {".map", ".url", ".unitypackage", ".ini", ".txt"}:
                            continue
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, ROOT_DIR)
                        zf.write(full_path, rel_path)


def main():
    os.makedirs(DIST_DIR, exist_ok=True)

    web_zip = os.path.join(DIST_DIR, "Zortex-Web-HTML5-v2.5.0.zip")
    print(f"[*] Building Web HTML5 Bundle (itch.io & CrazyGames): {web_zip}")
    build_web_zip(web_zip)
    print(f"    [OK] Size: {os.path.getsize(web_zip) / (1024 * 1024):.2f} MB")

    if os.path.isdir(UNPACKED_DIR):
        win_zip = os.path.join(DIST_DIR, "Zortex-Windows-v2.5.0.zip")
        print(f"[*] Building Native Windows Bundle (itch.io Windows): {win_zip}")
        zip_directory(UNPACKED_DIR, win_zip)
        print(f"    [OK] Size: {os.path.getsize(win_zip) / (1024 * 1024):.2f} MB")
    else:
        print("[!] dist/win-unpacked not found. Run 'node scripts/build_native_exe.cjs' first.")


if __name__ == "__main__":
    main()
