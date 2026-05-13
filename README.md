# ASK - Smart CLI Agent

A function-first CLI AI agent powered by Ollama.
The agent is configured to use calculator tools for arithmetic requests.

## Prerequisites

- Node.js 18+
- Docker Desktop (or compatible Docker engine)

## Environment

Create a .env file in the project root with at least:

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

## Tool Behavior

The agent can call only these calculator tools for arithmetic:

- add(a, b): for plus and sum requests, example 2+3
- subtract(a, b): for minus and difference requests, example 9-4
- multiply(a, b): for times and product requests, example 6*7
- divide(a, b): for divide and quotient requests, example 8/2

If input is unclear, the agent asks a clarification question.
Division by zero is handled by the divide tool and returns an error message.

## Notes

- Do not commit real secrets.
- Keep tool contracts in src/tools/index.js aligned with src/tools/calculator.js.
