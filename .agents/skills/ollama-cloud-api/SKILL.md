---
name: ollama-cloud-api
description: Calls open models like gemma4:31b via Ollama's Cloud API (https://ollama.com). Use when you need to query, reason, or benchmark with Ollama hosted models.
---

# Ollama Cloud API Skill

Use this skill to query open models on Ollama's Cloud API (`https://ollama.com`).

## Configuration & Credentials

- **API Endpoint**: `https://ollama.com/api/chat`
- **Default Model**: `gemma4:31b`
- **Authentication**: `Authorization: Bearer <OLLAMA_API_KEY>`
- **Key Location**: The script looks for `OLLAMA_API_KEY` in:
  1. Environment variable: `os.environ.get('OLLAMA_API_KEY')`
  2. Local `.env` file in the skill's directory (`scripts/.env`) or workspace root (`.env`).

## How to Query Ollama

Execute the bundled runner script:

```bash
python .agents/skills/ollama-cloud-api/scripts/query_ollama.py "Your prompt here"
```

Or pass messages JSON:

```bash
python .agents/skills/ollama-cloud-api/scripts/query_ollama.py --messages '[{"role": "user", "content": "Hello"}]'
```

Options:
- `--model <name>`: Model name (defaults to `gemma4:31b`).
- `--system <prompt>`: Optional system instruction.
