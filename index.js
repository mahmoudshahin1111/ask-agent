const fs = require("fs");
const path = require("path");

function loadEnv(envPath) {
	if (!fs.existsSync(envPath)) {
		return;
	}

	const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) {
			continue;
		}

		const separatorIndex = line.indexOf("=");
		if (separatorIndex < 0) {
			continue;
		}

		const key = line.slice(0, separatorIndex).trim();
		const value = line.slice(separatorIndex + 1).trim();

		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
}

async function askOllama(prompt) {
	const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
	const model = process.env.OLLAMA_MODEL || "llama3.1";
	const endpoint = `${baseUrl.replace(/\/$/, "")}/api/chat`;

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			stream: false,
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
		}),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Ollama API error (${response.status}): ${body}`);
	}

	const data = await response.json();
	return data?.message?.content || "";
}

async function main() {
	loadEnv(path.join(process.cwd(), ".env"));

	const prompt = process.argv.slice(2).join(" ").trim();
	if (!prompt) {
		console.log("Usage: node index.js \"your prompt\"");
		process.exit(1);
	}

	try {
		const output = await askOllama(prompt);
		console.log(output);
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

main();
