#!/usr/bin/env python3
"""
Ollama Cloud API Runner for Antigravity Skill
Queries Ollama cloud models (default: gemma4:31b) using the official REST API.
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.error

def find_api_key():
    # 1. Environment variable
    key = os.environ.get('OLLAMA_API_KEY')
    if key and key.strip():
        return key.strip()

    # 2. Check skill directory .env or repo root .env
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(script_dir, ".env"),
        os.path.abspath(os.path.join(script_dir, "..", "..", "..", ".env")),
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith('#'):
                            continue
                        if line.startswith('export '):
                            line = line[7:].strip()
                        if '=' in line:
                            k, v = line.split('=', 1)
                            if k.strip() == 'OLLAMA_API_KEY':
                                cleaned = v.strip().strip("'\"")
                                if cleaned:
                                    return cleaned
            except Exception:
                pass
    return None

def query_ollama(messages, model="gemma4:31b", stream=False):
    key = find_api_key()
    if not key:
        print(json.dumps({"error": "OLLAMA_API_KEY is not set. Please set the environment variable or add it to .agents/skills/ollama-cloud-api/scripts/.env"}), file=sys.stderr)
        sys.exit(1)

    payload = {
        "model": model,
        "messages": messages,
        "stream": stream
    }

    req = urllib.request.Request(
        "https://ollama.com/api/chat",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "Antigravity-Ollama-Skill/1.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data
    except urllib.error.HTTPError as err:
        err_msg = ""
        try:
            err_msg = err.read().decode('utf-8')
        except Exception:
            err_msg = str(err)
        print(f"HTTP Error {err.code}: {err_msg}", file=sys.stderr)
        sys.exit(1)
    except Exception as err:
        print(f"Error connecting to Ollama Cloud API: {err}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Query Ollama Cloud API")
    parser.add_argument("prompt", nargs="?", help="Direct prompt text to send")
    parser.add_argument("--messages", help="JSON array of messages (e.g. '[{\"role\":\"user\",\"content\":\"hi\"}]')")
    parser.add_argument("--model", default="gemma4:31b", help="Model name (default: gemma4:31b)")
    parser.add_argument("--system", help="Optional system prompt")
    parser.add_argument("--raw", action="store_true", help="Print full raw JSON response")

    args = parser.parse_args()

    messages = []
    if args.system:
        messages.append({"role": "system", "content": args.system})

    if args.messages:
        try:
            parsed = json.loads(args.messages)
            if isinstance(parsed, list):
                messages.extend(parsed)
            else:
                messages.append({"role": "user", "content": str(args.messages)})
        except Exception:
            messages.append({"role": "user", "content": args.messages})
    elif args.prompt:
        messages.append({"role": "user", "content": args.prompt})
    else:
        # Read from stdin if piped
        if not sys.stdin.isatty():
            content = sys.stdin.read().strip()
            if content:
                messages.append({"role": "user", "content": content})

    if not messages:
        parser.print_help()
        sys.exit(1)

    result = query_ollama(messages=messages, model=args.model)

    if args.raw:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        reply = result.get("message", {}).get("content", "")
        print(reply)

if __name__ == "__main__":
    main()
