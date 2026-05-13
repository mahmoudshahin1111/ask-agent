# ASK - Smart CLI Agent

<img width="350" height="350" alt="ai_agent_tool_logo" src="https://github.com/user-attachments/assets/5fbd37e7-9551-4ae3-b018-46e3578fb667" />



A function-first CLI AI agent powered by Ollama.
The agent is configured to use calculator tools for arithmetic requests.

<img width="831" height="156" alt="2026-05-14_0-00-47" src="https://github.com/user-attachments/assets/ff7c223a-4896-4a4a-b86f-321f4734fa36" />

<img width="579" height="152" alt="2026-05-14_0-07-43" src="https://github.com/user-attachments/assets/cb9940d6-1dfe-43c7-bb4a-1fcaef535c4f" />

## Prerequisites

- Node.js 18+
- Docker Desktop (or compatible Docker engine)

## Environment

Create a .env file in the project root with at least:

- DEBUG=true
- OLLAMA_MODEL=llama3.1
- LOG_LEVEL=info

Note: The app defaults to llama3.1 if OLLAMA_MODEL is not set.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start Docker services:

```bash
docker compose up -d
```

3. Verify Ollama API is reachable:

```bash
curl http://localhost:11434/api/tags
```

## Run

Start the CLI agent:

```bash
npm run start
```

Exit with:

```text
/bye
```

## Notes

- Do not commit real secrets.
- Keep tool contracts in src/tools/index.js aligned with src/tools/calculator.js.
