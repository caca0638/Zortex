# -*- coding: utf-8 -*-
import os
import zipfile
import time

src_dir = r"c:\Users\user\Desktop\zort"
target_zip = r"c:\Users\user\Desktop\zortex_oyun_ve_kod_akisi.zip"
temp_zip = r"c:\Users\user\Desktop\zortex_oyun_ve_kod_akisi_temp.zip"

print(f"[*] Packaging project from: {src_dir}")
print(f"[*] Target zip: {target_zip}")

top_level_files = [
    "AGENTS.md",
    "AI_HANDOVER_AND_CODEFLOW.md",
    "AUDIO_CREDITS.md",
    "CHANGELOG_FX.md",
    "README.md",
    "app.py",
    "index.html",
    "oyna.bat",
    "package-lock.json",
    "package.json",
    "phase2_background_verified.png",
    "phase3_particles_trails_verified.png",
    "phase4_juice_postprocess_verified.png",
    "phase5_readability_verified.png",
    "pixi.v8.min.js",
    "pixi.v8.min.mjs"
]

include_dirs = [
    "assets",
    "docs",
    "js",
    "research",
    "scratch",
    "scripts",
    "src",
    "vendor"
]

def should_exclude(dirpath, filename=None):
    parts = dirpath.replace("\\", "/").split("/")
    for p in parts:
        if p.startswith(".") or p.startswith("app_profile") or p == "__pycache__" or p == "node_modules":
            return True
    if filename:
        if filename.startswith(".") or filename.endswith(".pyc") or filename.endswith(".bak") or filename.endswith(".zip"):
            return True
        if ".bak_" in filename:
            return True
    return False

if os.path.exists(temp_zip):
    os.remove(temp_zip)

start_time = time.time()
file_count = 0

with zipfile.ZipFile(temp_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    # 1. Add top level files
    for fname in top_level_files:
        fpath = os.path.join(src_dir, fname)
        if os.path.exists(fpath):
            zf.write(fpath, arcname=fname)
            file_count += 1
            print(f"  [+] Added root file: {fname}")
        else:
            print(f"  [-] Warning: File not found: {fname}")

    # 2. Add directories
    for dname in include_dirs:
        dpath = os.path.join(src_dir, dname)
        if not os.path.exists(dpath):
            print(f"  [-] Directory not found: {dname}")
            continue
        print(f"  [*] Processing directory: {dname}...")
        for root, dirs, files in os.walk(dpath):
            # Prune excluded dirs in-place
            dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d))]
            if should_exclude(root):
                continue
            for file in sorted(files):
                if should_exclude(root, file):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, src_dir).replace("\\", "/")
                zf.write(full_path, arcname=rel_path)
                file_count += 1

# Atomic replacement
if os.path.exists(target_zip):
    backup_zip = target_zip + ".old"
    if os.path.exists(backup_zip):
        os.remove(backup_zip)
    os.replace(target_zip, backup_zip)
    os.replace(temp_zip, target_zip)
    if os.path.exists(backup_zip):
        os.remove(backup_zip)
else:
    os.replace(temp_zip, target_zip)

duration = time.time() - start_time
size_mb = os.path.getsize(target_zip) / (1024 * 1024)

print(f"\n[SUCCESS] Archive created successfully!")
print(f"  Files packaged: {file_count}")
print(f"  Archive size:   {size_mb:.2f} MB")
print(f"  Time taken:     {duration:.2f} seconds")
print(f"  Path:           {target_zip}")
