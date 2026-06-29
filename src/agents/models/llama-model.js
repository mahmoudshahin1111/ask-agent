import ollama from "ollama";
import { executeOperation } from "../../utils/print.js";
import { logger } from "../../utils/logger.js";
import { ROLES } from "../../utils/constants.js";
import { parseToolArguments } from "../utils/tool-arguments.js";
import { askToContinueAfterLimit } from "../utils/round-limit.js";
import { executeToolWithFallback, tools } from "../../tools/index.js";

const runOllamaFlow = async (
  input,
  { model, maxRounds, systemPrompt, defaultMaxRounds },
) => {
  const messages = [
    {
      role: ROLES.SYSTEM,
      content: systemPrompt,
    },
    {
      role: ROLES.USER,
      content: input,
    },
  ];

  let roundsLeft = maxRounds ?? defaultMaxRounds;

  while (true) {
    const response = await executeOperation(`${model} is thinking...`, () =>
      ollama.chat({
        model,
        messages,
        tools,
      }),
    );

    const message = response.message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content || "";
    }

    messages.push(message);

    for (const toolCall of message.tool_calls) {
      const name = toolCall.function?.name;
      const args = parseToolArguments(toolCall.function?.arguments);

      logger.debug(`Tool call: ${name} with arguments ${JSON.stringify(args)}`);

      const result = await executeToolWithFallback(name, args);

      messages.push({
        role: ROLES.TOOL,
        content: String(result),
      });
    }

    roundsLeft -= 1;
    if (roundsLeft > 0) continue;

    const continueConversation = await askToContinueAfterLimit();
    if (!continueConversation) {
      return "Agent stopped by user after reaching maximum tool rounds.";
    }

    roundsLeft = maxRounds ?? defaultMaxRounds;
  }
};

const createLlamaModel = ({
  systemPrompt,
  taskSystemPrompt,
  defaultModel,
  defaultTaskModel,
  defaultMaxRounds,
}) => {
  return {
    id: "llama-native",
    mode: "llama",
    name: "Native Llama (Ollama)",
    description:
      "Uses a local Ollama Llama model with tool loops for questions and task execution.",
    apiKey: null,
    requiresApiKey: false,
    run: async (input, options = {}) => {
      return runOllamaFlow(input, {
        model: options.model || defaultModel,
        maxRounds: options.maxRounds,
        systemPrompt,
        defaultMaxRounds,
      });
    },
    runTask: async (task, options = {}) => {
      return runOllamaFlow(task, {
        model: options.model || defaultTaskModel,
        maxRounds: options.maxRounds,
        systemPrompt: taskSystemPrompt,
        defaultMaxRounds,
      });
    },
  };
};

export { createLlamaModel };