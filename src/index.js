import { config } from "dotenv";
import {
  print,
  memory,
  getTextWithRole,
} from "./utils/index.js";
import { appState } from "./state/index.js";
import { input, select } from "@inquirer/prompts";
import { MODELS, ROLES } from "./utils/index.js";

config();

const SPINNER_FRAMES = ["|", "/", "-", "\\"];
const SPINNER_INTERVAL_MS = 80;

const startLoadingSpinner = (message) => {
  if (!process.stdout.isTTY) {
    return () => {};
  }

  let frameIndex = 0;
  process.stdout.write(`\r${SPINNER_FRAMES[frameIndex]} ${message}`);

  const timer = setInterval(() => {
    frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
    process.stdout.write(`\r${SPINNER_FRAMES[frameIndex]} ${message}`);
  }, SPINNER_INTERVAL_MS);

  return () => {
    clearInterval(timer);
    process.stdout.write("\r\x1b[K");
  };
};

async function startChat() {
  const agent = appState.getSelectedAgent();
  console.log(`\nChatting with ${agent.name}. Type "exit" to quit.\n`);
  print(
    ROLES.SYSTEM,
    `You are now chatting with ${agent.name}. How can I assist you today?`,
  );

  while (true) {
    const userMessage = await input(
      {
        required: true,
        message: getTextWithRole(ROLES.USER, "Your message:"),
      },
      { clearPromptOnDone: true },
    );

    if (userMessage.toLowerCase() === "exit") {
      console.log("Goodbye!");
      break;
    }

    memory.reset();
    const stopSpinner = startLoadingSpinner(`${agent.name} is thinking...`);
    let response;

    try {
      response = await agent.run(userMessage);
    } finally {
      stopSpinner();
    }

    print(ROLES.AGENT, response);
  }
}

const selectAgent = async () => {
  const agentId = await select({
    message: "Select an AI agent",
    choices: appState.getAgents().map((agent) => ({
      name: agent.name,
      value: agent.id,
    })),
  });

  appState.selectAgent(agentId);

  const agent = appState.getSelectedAgent();
  if (agent.requiresApiKey && !appState.getSelectedAgentApiKey()) {
    const apiKey = await input(
      {
        required: true,
        message: `Enter API key for ${agent.name}:`,
      },
      { clearPromptOnDone: true },
    );
    appState.setSelectedAgentApiKey(apiKey);
  }

  console.log(`Started chat with: ${appState.getSelectedAgent().name}`);
};

// initialize the app state with available agents and select the default agent
appState.setAgents(MODELS);
//
selectAgent().then(async () => {
  await startChat();
});
