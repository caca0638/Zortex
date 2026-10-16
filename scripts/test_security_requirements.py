import os
import sys
import time
import json
import shutil
import hashlib
import subprocess
import tempfile

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

import app

def run_tests():
    print("=" * 70)
    print("   GOREV 6: APP.PY GUCLENDIRME & KABUL TESTLERI")
    print("=" * 70)

    port = app.find_free_port(8895)
    server = app.start_server(port)
    base_url = f"http://127.0.0.1:{port}"
    time.sleep(0.5)

    try:
        # =========================================================================
        # Test 3a: Origin: http://evil.com ile GET ve POST -> 403 & Save Hash Check
        # =========================================================================
        print("\n" + "#" * 70)
        print("--- [TEST 3a] Origin: http://evil.com ile GET ve POST -> 403 & Kayit Degismemeli ---")
        print("#" * 70)

        # GET with evil origin
        cmd_evil_get = ["curl", "-s", "-i", "-H", "Origin: http://evil.com", f"{base_url}/api/save"]
        out_evil_get = subprocess.check_output(cmd_evil_get, text=True, errors='replace')
        print("[GET Istegi]:")
        print(out_evil_get.strip())

        # Hash before evil POST
        save_file = app.SAVE_FILE
        if os.path.exists(save_file):
            with open(save_file, "rb") as f:
                hash_before = hashlib.sha256(f.read()).hexdigest()
        else:
            hash_before = "NO_SAVE_FILE"
        print(f"\n[POST Oncesi Kayit SHA256 Hash]: {hash_before}")

        # Evil POST attempt to tamper with save
        malicious_payload = json.dumps({
            "profiles": {
                "hacker": {
                    "meta": {"scrap": 999999, "levels": {"hp": 99}}
                }
            },
            "activeProfile": "hacker",
            "savedAt": time.time()
        })
        cmd_evil_post = [
            "curl", "-s", "-i",
            "-X", "POST", f"{base_url}/api/save",
            "-H", "Origin: http://evil.com",
            "-H", "Content-Type: application/json",
            "-d", malicious_payload
        ]
        out_evil_post = subprocess.check_output(cmd_evil_post, text=True, errors='replace')
        print("\n[POST Istegi]:")
        print(out_evil_post.strip())

        # Hash after evil POST
        if os.path.exists(save_file):
            with open(save_file, "rb") as f:
                hash_after = hashlib.sha256(f.read()).hexdigest()
        else:
            hash_after = "NO_SAVE_FILE"
        print(f"\n[POST Sonrasi Kayit SHA256 Hash]: {hash_after}")

        post_403 = "403 Forbidden" in out_evil_post or "403" in out_evil_post.splitlines()[0]
        get_403 = "403 Forbidden" in out_evil_get or "403" in out_evil_get.splitlines()[0]
        hash_unchanged = (hash_before == hash_after)
        print(f"\nSonuc 3a: GET 403={get_403}, POST 403={post_403}, Hash Degismedi={hash_unchanged}")
        assert get_403 and post_403 and hash_unchanged, "Test 3a basarisiz oldu!"

        # =========================================================================
        # Test 3b: Content-Type: text/plain ile POST -> 415
        # =========================================================================
        print("\n" + "#" * 70)
        print("--- [TEST 3b] Content-Type: text/plain ile POST -> 415 Unsupported Media Type ---")
        print("#" * 70)
        cmd_415 = [
            "curl", "-s", "-i",
            "-X", "POST", f"{base_url}/api/save",
            "-H", "Content-Type: text/plain",
            "-d", '{"profiles": {}}'
        ]
        out_415 = subprocess.check_output(cmd_415, text=True, errors='replace')
        print(out_415.strip())
        is_415 = "415" in out_415.splitlines()[0]
        print(f"\nSonuc 3b: POST Content-Type text/plain -> 415={is_415}")
        assert is_415, "Test 3b basarisiz oldu!"

        # =========================================================================
        # Test 3c: Host: evil.com ile GET -> 403 (DNS Rebinding Korumasi)
        # =========================================================================
        print("\n" + "#" * 70)
        print("--- [TEST 3c] Host: evil.com ile GET -> 403 Forbidden (DNS Rebinding Korumasi) ---")
        print("#" * 70)
        cmd_evil_host = [
            "curl", "-s", "-i",
            "-H", "Host: evil.com",
            f"{base_url}/api/save"
        ]
        out_evil_host = subprocess.check_output(cmd_evil_host, text=True, errors='replace')
        print(out_evil_host.strip())
        is_host_403 = "403" in out_evil_host.splitlines()[0]
        print(f"\nSonuc 3c: Host evil.com -> 403={is_host_403}")
        assert is_host_403, "Test 3c basarisiz oldu!"

        # =========================================================================
        # Ek Kontrol: Cache-Control Basligi Tekil mi?
        # =========================================================================
        print("\n" + "#" * 70)
        print("--- [EK KONTROL] Cache-Control Basliginin Tekilligi ---")
        print("#" * 70)
        cmd_cache = ["curl", "-s", "-i", f"{base_url}/index.html"]
        out_cache = subprocess.check_output(cmd_cache, text=True, errors='replace')
        cache_lines = [l for l in out_cache.splitlines() if l.lower().startswith("cache-control:")]
        print("Response Cache-Control basliklari:")
        for l in cache_lines:
            print(f"  {l}")
        print(f"Toplam Cache-Control baslik adedi: {len(cache_lines)}")
        assert len(cache_lines) == 1, "Cache-Control basligi tekil degil!"

        # =========================================================================
        # Test 3d: grep -n "ThreadingHTTPServer" app.py
        # =========================================================================
        print("\n" + "#" * 70)
        print("--- [TEST 3d] grep -n \"ThreadingHTTPServer\" app.py ---")
        print("#" * 70)
        app_path = os.path.join(REPO_ROOT, "app.py")
        grep_results = []
        with open(app_path, "r", encoding="utf-8") as f:
            for idx, line in enumerate(f, 1):
                if "ThreadingHTTPServer" in line:
                    grep_results.append(f"{idx}:{line.rstrip()}")
        for gr in grep_results:
            print(gr)
        assert len(grep_results) >= 2, "ThreadingHTTPServer bulunamadi!"

        # =========================================================================
        # Test 3e: Kayit Tasima Kaniti (Onceki dosya listesi, Sonraki dosya listesi,
        #          eski konumda dosya kalmadigi)
        # =========================================================================
        print("\n" + "#" * 70)
        print("--- [TEST 3e] Kayit Tasima Kaniti & Dogrulamasi ---")
        print("#" * 70)
        # Guvenli yedekleme
        real_profile_dir = app.PROFILE_DIR
        real_save = app.SAVE_FILE
        backup_save = os.path.join(real_profile_dir, "save_data.json.backup_safe")
        if os.path.exists(real_save) and not os.path.exists(backup_save):
            shutil.copy2(real_save, backup_save)
            print(f"[*] Gercek kullanici kaydi guvenle yedeklendi: {backup_save}")

        legacy_dir = os.path.join(REPO_ROOT, ".app_profile")
        demo_legacy_save = os.path.join(legacy_dir, "save_data.json")

        # 1. Eski konum hazirlama (Tasimadan once)
        os.makedirs(legacy_dir, exist_ok=True)
        sample_data = {
            "profiles": {
                "test_hero": {"meta": {"scrap": 450, "levels": {"hp": 3}}}
            },
            "activeProfile": "test_hero",
            "savedAt": 1700000000.0
        }
        with open(demo_legacy_save, "w", encoding="utf-8") as f:
            json.dump(sample_data, f, indent=2)

        with open(os.path.join(legacy_dir, "session_state.txt"), "w") as f:
            f.write("active")

        # Onceki liste
        files_before = sorted(os.listdir(legacy_dir))
        print("1. Tasimadan ONCE eski konumdaki (.app_profile) dosya listesi:")
        for fn in files_before:
            print(f"   - {fn} ({os.path.getsize(os.path.join(legacy_dir, fn))} bayt)")

        # 2. Tasima islemini calistir
        print("\n2. migrate_legacy_save() cagiriliyor...")
        app.migrate_legacy_save()

        # 3. Sonraki liste (Yeni harici konumda)
        files_after_new = sorted(os.listdir(real_profile_dir))
        print(f"\n3. Tasimadan SONRA yeni harici konumdaki ({real_profile_dir}) dosya listesi:")
        for fn in files_after_new:
            print(f"   - {fn} ({os.path.getsize(os.path.join(real_profile_dir, fn))} bayt)")

        # 4. Eski konumda artik dosya kalmadiginin kaniti
        legacy_exists = os.path.exists(legacy_dir)
        print(f"\n4. Eski konum ({legacy_dir}) mevcut mu?: {legacy_exists}")
        if legacy_exists:
            remaining_files = os.listdir(legacy_dir)
            print(f"   Eski konumdaki kalan dosyalar: {remaining_files}")
        else:
            print("   Eski konum (.app_profile) servis edilen webroot kokunden tamamen SILINDI/TASINDI.")

        assert not legacy_exists, "Eski dizin silinmedi!"

        # 5. Geri yukleme: test ornegini gercek yedekten temizce geri yukle
        if os.path.exists(backup_save):
            shutil.copy2(backup_save, real_save)
            print(f"\n[*] Gercek kullanici kaydi basariyla dogrulandi ve korundu ({os.path.getsize(real_save)} bayt).")

        print("\n" + "=" * 70)
        print("   TUM KABUL TESTLERI BASARIYLA TAMAMLANDI (PASS)")
        print("=" * 70)
        return 0

    finally:
        server.shutdown()

if __name__ == "__main__":
    sys.exit(run_tests())
