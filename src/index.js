import { config } from "dotenv";
import {
  print,
  memory,
  getColorBasedOnRole,
  getTextWithRole,
} from "./utils/index.js";
import { appState } from "./state/index.js";
import { input, select } from "@inquirer/prompts";
import { MODELS, ROLES } from "./utils/index.js";

config();

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
        message: getTextWithRole(ROLES.USER),
        theme: {
          prefix: "",
        },
      },
      { clearPromptOnDone: true },
    );

    if (userMessage.toLowerCase() === "exit") {
      console.log("Goodbye!");
      break;
    }

    memory.reset();
    const response = await agent.run(userMessage);

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

appState.setAgents(MODELS);

selectAgent().then(async () => {
  await startChat();
});
