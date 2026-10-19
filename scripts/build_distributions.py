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
                arcname = rel_path.replace(os.sep, "/")
                zf.write(full_path, arcname)


def sync_core_files_to_dist(dest_dir):
    import shutil
    os.makedirs(os.path.join(dest_dir, "js", "core"), exist_ok=True)
    shutil.copy2(os.path.join(ROOT_DIR, "index.html"), os.path.join(dest_dir, "index.html"))
    shutil.copy2(os.path.join(ROOT_DIR, "js", "core", "localization.js"), os.path.join(dest_dir, "js", "core", "localization.js"))
    shutil.copy2(os.path.join(ROOT_DIR, "js", "core", "crazygames_sdk.js"), os.path.join(dest_dir, "js", "core", "crazygames_sdk.js"))


def main():
    os.makedirs(DIST_DIR, exist_ok=True)

    crazy_src = os.path.join(DIST_DIR, "crazygames_upload", "zortex")
    itch_src = os.path.join(DIST_DIR, "itch_upload")

    if os.path.isdir(crazy_src):
        sync_core_files_to_dist(crazy_src)
        web_zip = os.path.join(DIST_DIR, "Zortex-Web-HTML5-v2.5.0.zip")
        print(f"[*] Building CrazyGames Bundle (<1000 files, POSIX slashes): {web_zip}")
        zip_directory(crazy_src, web_zip)
        with zipfile.ZipFile(web_zip, "r") as zf:
            entry_count = len(zf.namelist())
        print(f"    [OK] Size: {os.path.getsize(web_zip) / (1024 * 1024):.2f} MB, Entries: {entry_count}")

    if os.path.isdir(itch_src):
        sync_core_files_to_dist(itch_src)
        itch_zip = os.path.join(DIST_DIR, "Zortex-itch-v2.5.0.zip")
        print(f"[*] Building Itch.io Web Bundle (<1000 files, POSIX slashes): {itch_zip}")
        zip_directory(itch_src, itch_zip)
        with zipfile.ZipFile(itch_zip, "r") as zf:
            entry_count = len(zf.namelist())
        print(f"    [OK] Size: {os.path.getsize(itch_zip) / (1024 * 1024):.2f} MB, Entries: {entry_count}")

    if os.path.isdir(UNPACKED_DIR):
        win_zip = os.path.join(DIST_DIR, "Zortex-Windows-v2.5.0.zip")
        print(f"[*] Building Native Windows Bundle (itch.io Windows): {win_zip}")
        zip_directory(UNPACKED_DIR, win_zip)
        print(f"    [OK] Size: {os.path.getsize(win_zip) / (1024 * 1024):.2f} MB")
    else:
        print("[!] dist/win-unpacked not found. Run 'node scripts/build_native_exe.cjs' first.")


if __name__ == "__main__":
    main()
