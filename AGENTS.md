# AGENTS.md

This file provides guidance to AI coding agents when working in this repository.

---

## Project Overview

A CLI-based AI tool that answers questions by calling functions and leveraging its own knowledge base. The majority of the tool's work is function-driven — the AI model should **primarily rely on its functions**, not internal knowledge, to produce answers.

- **Runtime:** Node.js (latest LTS)
- **AI Model:** Llama (running via Docker)
- **Interface:** Command Line (CLI)

---

## Repository Structure

```
.
├── src/
│   ├── cli/           # CLI entry point and argument parsing
│   ├── functions/     # Registered callable functions (core of the tool)
│   ├── ai/            # Llama model client and prompt handling
│   └── utils/         # Shared utility helpers — check here before writing new logic
├── .env.example       # Required environment variables (no secrets)
├── docker-compose.yml # Llama model + API service definitions
└── AGENTS.md          # ← you are here
```

---

## Getting Started

### 1. Start the AI Model & API (Docker — required first)

The Llama model and its API are served via Docker. **Always start Docker before running the project.**

```bash
docker compose up -d
```

Verify the API is reachable before proceeding:

```bash
curl http://localhost:11434/api/tags   # or the configured LLAMA_API_URL
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the CLI Tool

```bash
npm run start
```

### Stopping Docker

```bash
docker compose down
```

---

## Environment Variables

All required variables are documented in `.env.example`. **Never hard-code secrets or API endpoints** in source files.

| Variable | Description |
|----------|-------------|
| `LLAMA_API_URL` | Base URL for the Llama API served by Docker |
| `LLAMA_MODEL` | Model name/tag to use (e.g., `llama3`) |
| `LOG_LEVEL` | Logging verbosity: `debug`, `info`, `warn`, `error` |

> **Agents must not modify `.env` or any file containing real credentials.**

---

## Architecture & Design Decisions

- **Function-first answers:** The AI model must **call registered functions** to retrieve information. Answering from model knowledge alone should be the last resort, not the default. When adding new capabilities, implement them as functions in `src/functions/`.
- **Llama via Docker:** The model is not bundled into the app. It runs as a separate service. All model calls go through the API exposed by Docker.
- **CLI interface:** The tool is invoked from the terminal. There is no web server or persistent background process on the Node.js side.
- **Utility-first:** Common logic (formatting, parsing, HTTP calls) lives in `src/utils/`. Always check there before writing new helpers.

---

## Security Rules

Agents must actively avoid introducing security issues:

- **No secret exposure:** Never log, print, or include API keys, tokens, or credentials in output, error messages, or source files.
- **Validate all external input:** Any argument passed via CLI or returned from an external function call must be validated before use. Do not trust raw input.
- **No arbitrary code execution:** Do not use `eval()`, `new Function()`, or `child_process.exec()` with unsanitized strings.
- **Dependency hygiene:** Do not add new `npm` packages without explicit approval. Each new dependency is a potential attack surface.
- **Environment isolation:** All model inference happens inside Docker. Do not expose the Llama API port beyond localhost.

---

## Performance Rules

Agents must avoid introducing performance issues:

- **No infinite loops:** Every loop or recursive call must have a clearly defined and reachable exit condition. If a function can theoretically loop forever (e.g., retrying a failed API call), it must have a hard maximum iteration count and a timeout.
- **No unbounded retries:** API/model call retries must use a capped retry count (max 3) with exponential backoff.
- **No blocking the event loop:** Use `async/await` for all I/O. Never use synchronous file or network operations (`fs.readFileSync`, etc.) in the main execution path.
- **Stream large outputs:** If the model returns a long response, stream it rather than buffering the full output in memory.
- **Avoid redundant model calls:** Do not call the Llama API more than once per user question unless a function result explicitly requires a follow-up inference.

---

## Agent-Specific Instructions

### What agents SHOULD do

- Follow the existing code style — match the patterns already in the file you are editing.
- Prefer small, focused commits over large sweeping changes.
- Add inline comments when the logic is non-obvious.
- Check `src/utils/` for existing helpers before writing new ones.
- Ensure Docker is running and the Llama API is reachable before testing any AI-related code paths.
- Prefer adding new AI capabilities as **functions in `src/functions/`** rather than relying on the model's knowledge.

### What agents MUST NOT do

- Commit directly to `master`.
- Add new `npm` dependencies without explicit approval.
- Modify `.env` or any file containing real secrets.
- Use `// eslint-disable`, `# noqa`, or `//nolint` without an explanation comment directly above explaining why.
- Introduce `TODO` comments without an associated issue number (e.g., `// TODO #42: ...`).
- Write loops or recursive functions without a defined exit condition.
- Call the Llama API outside of the designated client in `src/ai/`.

---

## Pull Request Checklist

Before requesting review, verify:

- [ ] `docker compose up -d` starts cleanly with no errors
- [ ] `npm run start` runs without crashing
- [ ] All new functions are registered and reachable by the AI model
- [ ] No secrets, tokens, or credentials appear in the diff
- [ ] No new `npm` dependencies were added without approval
- [ ] Every loop and recursive call has a hard exit condition
- [ ] `.env.example` is updated if new variables were introduced