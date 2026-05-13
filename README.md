# ASK - Smart CLI Agent

A lightweight JavaScript CLI agent project scaffold.
This project is configured to use a local Ollama API endpoint.

## Project Structure

- `index.js` - Main CLI entry point
- `tools/calculator.js` - Basic math helper functions
- `tools/search.js` - Array/string search helper
- `tools/datetime.js` - Date/time helper functions
- `.env` - Environment configuration

## Prerequisites

- Node.js 18+

## Setup

1. Install dependencies (if/when package.json is added):
   ```bash
   npm install
   ```
2. Configure environment variables in `.env`:
   - `NODE_ENV`
   - `OLLAMA_BASE_URL`
   - `OLLAMA_MODEL`

## Local Ollama Setup

1. Install Ollama and run it locally.
2. Pull a model (example):
   ```bash
   ollama pull llama3.1
   ```
3. Ensure Ollama is running on `http://localhost:11434`.

## Run

Use Node.js to run the app entry file:

```bash
node index.js
```

Example prompt:

```bash
node index.js "Explain what this CLI project does"
```

## Notes

- Keep secrets in `.env` and avoid committing real API keys.
- Expand `index.js` to route commands to modules inside `tools/`.
- For docker make sure you have a big memory more than 8 GBs.
