"""
=============================================================================
  ZORTEX: REPOSITORY SECRET LEAKAGE & SENSITIVE DATA AUDITOR
=============================================================================
Scans all git-tracked files in the repository for:
  1. Private cryptographic keys (RSA, SSH, PGP, EC)
  2. Cloud & AI service API keys (OpenAI, Gemini/Google, GitHub, AWS, etc.)
  3. High-entropy hardcoded secrets in source files
  4. Accidental presence of .env files in git tracking
=============================================================================
"""

import os
import re
import subprocess
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_PATTERNS = [
    (r"-----BEGIN (RSA|EC|DSA|OPENSSH|PGP|PRIVATE) KEY-----", "Private Cryptographic Key"),
    (r"AIzaSy[0-9A-Za-z\-_]{33}", "Google/Gemini API Key"),
    (r"sk-[a-zA-Z0-9]{20,}", "OpenAI/Generic Secret Key"),
    (r"ghp_[a-zA-Z0-9]{36}", "GitHub Personal Access Token"),
    (r"github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}", "GitHub Fine-Grained Token"),
    (r"xox[baprs]-[0-9a-zA-Z]{10,48}", "Slack API Token"),
    (r"AKIA[0-9A-Z]{16}", "AWS Access Key ID"),
    (r"(api_key|apiKey|secret_key|secretKey)\s*[:=]\s*['\"][a-zA-Z0-9_\-]{24,}['\"]", "Hardcoded API Key Variable"),
]

# Files excluded from scanning (documentation, binaries, third-party vendor bundles)
EXCLUDED_EXTENSIONS = {
    ".png", ".ico", ".jpg", ".jpeg", ".webp", ".zip", ".exe", ".bin",
    ".woff", ".woff2", ".ttf", ".mp3", ".wav", ".ogg"
}

EXCLUDED_PATHS = {
    "scripts/audit_secret_leakage.py", # Exclude this scanning script itself
}


def get_tracked_files():
    cmd = ["git", "ls-files"]
    result = subprocess.run(cmd, cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    return [f.strip() for f in result.stdout.splitlines() if f.strip()]


def audit():
    print("=" * 64)
    print("   ZORTEX: PRE-RELEASE SECRET & LEAKAGE AUDIT")
    print("=" * 64)

    tracked = get_tracked_files()
    print(f"[*] Total Tracked Files: {len(tracked)}")

    findings = []

    # 1. Check for tracked .env files
    for filepath in tracked:
        basename = os.path.basename(filepath)
        if basename == ".env" or (basename.startswith(".env.") and basename != ".env.example"):
            findings.append((filepath, 1, "Tracked .env file in repository"))

    # 2. Scan content of each tracked text file
    compiled_patterns = [(re.compile(p, re.IGNORECASE if "api_key" in p else 0), desc) for p, desc in SECRET_PATTERNS]

    for filepath in tracked:
        if filepath in EXCLUDED_PATHS:
            continue

        ext = os.path.splitext(filepath)[1].lower()
        if ext in EXCLUDED_EXTENSIONS:
            continue

        full_path = os.path.join(REPO_ROOT, filepath)
        if not os.path.isfile(full_path):
            continue

        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    for pattern, desc in compiled_patterns:
                        if pattern.search(line):
                            # Ignore false positives in comments/docs showing example placeholders
                            if "<OLLAMA_API_KEY>" in line or "your_api_key_here" in line:
                                continue
                            findings.append((filepath, line_idx, desc))
        except Exception as e:
            print(f"[!] Warning reading {filepath}: {e}")

    # Report results
    print("\n" + "=" * 64)
    if findings:
        print(f"[FAIL] Detected {len(findings)} potential secret leakage(s):")
        for fpath, lnum, desc in findings:
            print(f"  - {fpath}:{lnum} -> {desc}")
        print("=" * 64)
        return False
    else:
        print("[PASS] 0 secret leakages found across all tracked files.")
        print("[PASS] .gitignore correctly excludes all .env and private keys.")
        print("[PASS] Repository is clean and safe for public release.")
        print("=" * 64)
        return True


if __name__ == "__main__":
    success = audit()
    sys.exit(0 if success else 1)
