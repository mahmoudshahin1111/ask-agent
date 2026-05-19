FROM node:20-bookworm-slim

ARG OLLAMA_MODEL=llama3.1
ENV OLLAMA_MODEL=${OLLAMA_MODEL}
ENV OLLAMA_HOST=0.0.0.0:11434

WORKDIR /app

# Install curl for health checks and Ollama installation script
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates zstd \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 11434

CMD ["sh", "-c", "if [ ! -f /root/.ollama/install.sh ]; then curl -fsSL https://ollama.com/install.sh -o /root/.ollama/install.sh; fi; if ! command -v ollama > /dev/null 2>&1; then sh /root/.ollama/install.sh; fi; ollama serve & until curl -sf http://127.0.0.1:11434/api/tags > /dev/null; do sleep 1; done; ollama pull \"$OLLAMA_MODEL\";"]
