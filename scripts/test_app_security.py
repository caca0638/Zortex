import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

import time
import json
import subprocess
import tempfile
import app
from playwright.sync_api import sync_playwright

def run_acceptance_tests():
    port = app.find_free_port(8890)
    server = app.start_server(port)
    base_url = f"http://127.0.0.1:{port}"
    print("=" * 64)
    print("   ZORTEX: APP.PY SECURITY & PROFILE ACCEPTANCE TEST")
    print(f"   Server running on: {base_url}")
    print("=" * 64)

    results = {}

    # -------------------------------------------------------------
    # 1. 2 MB body POST to /api/save -> 413 Payload Too Large
    # -------------------------------------------------------------
    print("\n--- [TEST 1] 2 MB Body -> 413 Payload Too Large ---")
    with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp_2mb:
        tmp_2mb_path = tmp_2mb.name
        # Create a payload > 2 MB
        large_content = json.dumps({"profiles": {"p": {"filler": "X" * (2 * 1024 * 1024 + 100)}}})
        tmp_2mb.write(large_content.encode('utf-8'))

    try:
        cmd_2mb = [
            "curl", "-s", "-i",
            "-X", "POST", f"{base_url}/api/save",
            "-H", "Content-Type: application/json",
            "--data-binary", f"@{tmp_2mb_path}"
        ]
        out_2mb = subprocess.check_output(cmd_2mb, text=True, errors='replace')
        print(out_2mb.strip())
        results['test_1_413'] = ("413" in out_2mb)
    finally:
        if os.path.exists(tmp_2mb_path):
            os.remove(tmp_2mb_path)

    # -------------------------------------------------------------
    # 2. Invalid JSON / Invalid Schema -> 400 Bad Request
    # -------------------------------------------------------------
    print("\n--- [TEST 2A] Invalid JSON -> 400 Bad Request ---")
    cmd_bad_json = [
        "curl", "-s", "-i",
        "-X", "POST", f"{base_url}/api/save",
        "-H", "Content-Type: application/json",
        "-d", "{corrupted json: true"
    ]
    out_bad_json = subprocess.check_output(cmd_bad_json, text=True, errors='replace')
    print(out_bad_json.strip())
    results['test_2a_400'] = ("400" in out_bad_json)

    print("\n--- [TEST 2B] Invalid Schema -> 400 Bad Request ---")
    cmd_bad_schema = [
        "curl", "-s", "-i",
        "-X", "POST", f"{base_url}/api/save",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"unexpectedKey": 12345, "noProfiles": True})
    ]
    out_bad_schema = subprocess.check_output(cmd_bad_schema, text=True, errors='replace')
    print(out_bad_schema.strip())
    results['test_2b_400'] = ("400" in out_bad_schema)

    # -------------------------------------------------------------
    # 3. Different Origin -> No CORS header
    # -------------------------------------------------------------
    print("\n--- [TEST 3A] Untrusted Origin (http://evil.com) -> No Access-Control-Allow-Origin ---")
    cmd_cors_evil = [
        "curl", "-s", "-i",
        "-H", "Origin: http://evil.com",
        f"{base_url}/api/save"
    ]
    out_cors_evil = subprocess.check_output(cmd_cors_evil, text=True, errors='replace')
    print(out_cors_evil.strip())
    has_evil_cors = "Access-Control-Allow-Origin" in out_cors_evil
    results['test_3a_no_cors'] = (not has_evil_cors)
    print(f"CORS Header Present: {has_evil_cors} (Expected: False)")

    print("\n--- [TEST 3B] Same Origin (http://127.0.0.1:{port}) -> Access-Control-Allow-Origin present ---")
    cmd_cors_good = [
        "curl", "-s", "-i",
        "-H", f"Origin: {base_url}",
        f"{base_url}/api/save"
    ]
    out_cors_good = subprocess.check_output(cmd_cors_good, text=True, errors='replace')
    print(out_cors_good.strip())
    has_good_cors = f"Access-Control-Allow-Origin: {base_url}" in out_cors_good
    results['test_3b_same_origin_cors'] = has_good_cors
    print(f"Same-Origin CORS Header Present: {has_good_cors} (Expected: True)")

    # -------------------------------------------------------------
    # 4. GET /.app_profile/save_data.json -> 404 Not Found
    # -------------------------------------------------------------
    print("\n--- [TEST 4] GET /.app_profile/save_data.json -> 404 Not Found ---")
    cmd_get_profile = [
        "curl", "-s", "-i",
        f"{base_url}/.app_profile/save_data.json"
    ]
    out_get_profile = subprocess.check_output(cmd_get_profile, text=True, errors='replace')
    print(out_get_profile.strip())
    results['test_4_404'] = ("404" in out_get_profile)

    # -------------------------------------------------------------
    # 5. Open game with migrated save and verify progress is preserved
    # -------------------------------------------------------------
    print("\n--- [TEST 5] Open Game with Saved Profile & Verify Progress ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        page.goto(f"{base_url}/index.html")
        page.wait_for_function("typeof window.syncProfilesFromServer === 'function'")

        # Wait for async profile sync to complete
        page.wait_for_timeout(1000)

        profile_info = page.evaluate("""() => {
            const profilesStr = localStorage.getItem('zortex_profiles');
            const profiles = profilesStr ? JSON.parse(profilesStr) : null;
            const activeProfile = localStorage.getItem('zortex_active_profile');
            const meta = (typeof window.loadMeta === 'function') ? window.loadMeta() : null;

            return {
                activeProfile: activeProfile,
                profiles: profiles,
                meta: meta
            };
        }""")

        browser.close()

    print("Profile info loaded in browser:")
    print(f"  Active Profile: {profile_info.get('activeProfile')}")
    active_name = profile_info.get('activeProfile')
    active_data = (profile_info.get('profiles') or {}).get(active_name, {})
    meta_data = active_data.get('meta', {})
    print(f"  Scrap Count:    {meta_data.get('scrap')}")
    print(f"  HP Upgrade Lvl: {meta_data.get('levels', {}).get('hp')}")
    print(f"  Shield Lvl:     {meta_data.get('levels', {}).get('shield')}")
    print(f"  Achievements:   {list(meta_data.get('achievements', {}).keys())}")

    save_preserved = (
        profile_info.get('activeProfile') == 'seks' and
        meta_data.get('scrap') == 236 and
        meta_data.get('levels', {}).get('hp') == 2
    )
    results['test_5_save_preserved'] = save_preserved

    server.shutdown()

    print("\n" + "=" * 64)
    print("                   TEST SUMMARY RESULTS")
    print("=" * 64)
    all_passed = True
    for test_name, passed in results.items():
        status = "PASS" if passed else "FAIL"
        if not passed:
            all_passed = False
        print(f"  {test_name:30}: {status}")
    print("=" * 64)

    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(run_acceptance_tests())
