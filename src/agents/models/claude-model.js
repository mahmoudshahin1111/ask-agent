import Anthropic from "@anthropic-ai/sdk";
import { executeOperation } from "../../utils/print.js";
import { logger } from "../../utils/logger.js";
import { ROLES } from "../../utils/constants.js";
import { parseToolArguments } from "../utils/tool-arguments.js";
import { askToContinueAfterLimit } from "../utils/round-limit.js";
import { executeToolWithFallback, tools } from "../../tools/index.js";

const DEFAULT_CLAUDE_MODEL = "claude-opus-4-8";

const extractTextBlocks = (contentBlocks = []) => {
  return contentBlocks
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
};

const getAnthropicClient = (apiKey) => {
  if (!apiKey) {
    throw new Error("Missing Anthropic API key for Claude mode.");
  }

  return new Anthropic({ apiKey });
};

const runClaudeFlow = async (
  input,
  {
    apiKey,
    model = DEFAULT_CLAUDE_MODEL,
    maxRounds,
    systemPrompt,
    defaultMaxRounds,
  },
) => {
  const client = getAnthropicClient(apiKey);
  const messages = [
    {
      role: ROLES.USER,
      content: input,
    },
  ];

  let roundsLeft = maxRounds ?? defaultMaxRounds;

  while (true) {
    const response = await executeOperation(`${model} is thinking...`, () =>
      client.messages.create({
        model,
        max_tokens: 1024,
        system: [{ type: "text", text: systemPrompt }],
        messages,
        tools,
      }),
    );

    if (response.stop_reason === "tool_use") {
      const toolCalls = response.content.filter(
        (block) => block.type === "tool_use",
      );

      messages.push({
        role: "assistant",
        content: response.content,
      });

      const toolResults = [];

      for (const toolCall of toolCalls) {
        const args = parseToolArguments(toolCall.input);
        logger.debug(
          `Tool call: ${toolCall.name} with arguments ${JSON.stringify(args)}`,
        );

        const result = await executeToolWithFallback(toolCall.name, args);

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolCall.id,
          content: String(result),
        });
      }

      messages.push({
        role: ROLES.USER,
        content: toolResults,
      });

      roundsLeft -= 1;
      if (roundsLeft > 0) continue;

      const continueConversation = await askToContinueAfterLimit();
      if (!continueConversation) {
        return "Agent stopped by user after reaching maximum tool rounds.";
      }

      roundsLeft = maxRounds ?? defaultMaxRounds;
      continue;
    }

    if (response.stop_reason === "max_tokens") {
      return "Agent stopped because maximum tokens were reached.";
    }

    return extractTextBlocks(response.content);
  }
};

const createClaudeModel = ({
  apiKey,
  getApiKey,
  systemPrompt,
  taskSystemPrompt,
  defaultModel = DEFAULT_CLAUDE_MODEL,
  defaultMaxRounds,
}) => {
  return {
    id: "claude",
    mode: "claude",
    name: "Claude",
    description:
      "Uses Anthropic Claude with native tool-calling and planning-aware execution.",
    apiKey,
    requiresApiKey: true,
    run: async (input, options = {}) => {
      return runClaudeFlow(input, {
        apiKey: getApiKey(),
        model: options.model || defaultModel,
        maxRounds: options.maxRounds,
        systemPrompt,
        defaultMaxRounds,
      });
    },
    runTask: async (task, options = {}) => {
      return runClaudeFlow(task, {
        apiKey: getApiKey(),
        model: options.model || defaultModel,
        maxRounds: options.maxRounds,
        systemPrompt: taskSystemPrompt,
        defaultMaxRounds,
      });
    },
  };
};

export { createClaudeModel };