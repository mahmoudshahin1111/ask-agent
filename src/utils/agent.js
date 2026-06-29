import ollama from "ollama";
import { config } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { confirm } from "@inquirer/prompts";
import {
  print,
  getTextWithRole,
  startLoadingSpinner,
} from "./print.js";
import { logger } from "./logger.js";
import { ROLES } from "./constants.js";
import { executeTool, tools } from "../tools/index.js";
import { appState } from "../state/index.js";

config();

const DEFAULT_MAX_ROUNDS = 5;
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";
const DEFAULT_OLLAMA_TASK_MODEL =
  process.env.OLLAMA_TASK_MODEL || DEFAULT_OLLAMA_MODEL;
const DEFAULT_CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-4-8";

const SYSTEM_PROMPT = `
You are a function-first assistant. You NEVER compute, guess, or answer directly.
You always call the appropriate tool and return its result.

AVAILABLE TOOLS
- add, subtract, multiply, divide
- get_current_time
- search
- break_into_subtasks
- execute_subtask
- compile_report

DECISION LOGIC
- SIMPLE MODE: one operation -> call one tool and return result.
- SEARCH MODE: uncertain/current facts -> call search.
- PLANNING MODE: multi-step goal ->
  1) break_into_subtasks
  2) execute_subtask for each subtask (with previous context)
  3) compile_report

RULES
1) Use exact tool names.
2) Ask one short clarification question if required inputs are missing.
3) Keep outputs concise.
`;

const TASK_SYSTEM_PROMPT = `
You are a task execution assistant.
For complex tasks, always use planning tools in this order:
1) break_into_subtasks
2) execute_subtask for each subtask
3) compile_report
Keep each step concise and accurate.
`;

const parseToolArguments = (args) => {
  if (!args) return {};
  if (typeof args === "string") {
    try {
      return JSON.parse(args);
    } catch {
      return {};
    }
  }
  if (typeof args === "object") return args;
  return {};
};

const extractTextBlocks = (contentBlocks = []) => {
  return contentBlocks
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
};

const withLoadingSpinner = async (message, operation) => {
  const stopSpinner = startLoadingSpinner(message);

  try {
    return await operation();
  } finally {
    stopSpinner();
  }
};

const executeToolWithFallback = async (toolName, args) => {
  const result = await executeTool(toolName, args);
  if (result !== "Tool not found") return result;

  const planningFallbackNames = new Set([
    "break_into_subtasks",
    "execute_subtask",
    "compile_report",
  ]);

  if (!planningFallbackNames.has(toolName)) return result;
  return executeTool(`planning:${toolName}`, args);
};

const askToContinueAfterLimit = async () => {
  const shouldEnd = await confirm({
    message: getTextWithRole(
      ROLES.SYSTEM,
      "Maximum tool rounds reached. End conversation?",
    ),
    default: true,
  });

  return !shouldEnd;
};

const runOllamaFlow = async (
  input,
  { model = DEFAULT_OLLAMA_MODEL, maxRounds = DEFAULT_MAX_ROUNDS, systemPrompt },
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

  let roundsLeft = maxRounds;

  while (true) {
    const response = await withLoadingSpinner(
      `${model} is thinking...`,
      () =>
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

      logger.debug(
        `Tool call: ${name} with arguments ${JSON.stringify(args)}`,
      );

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

    roundsLeft = maxRounds;
  }
};

const getAnthropicClient = () => {
  const selectedKey = appState.getSelectedAgentApiKey?.();
  const apiKey = selectedKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Anthropic API key for Claude mode.");
  }

  return new Anthropic({ apiKey });
};

const runClaudeFlow = async (
  input,
  { model = DEFAULT_CLAUDE_MODEL, maxRounds = DEFAULT_MAX_ROUNDS, systemPrompt },
) => {
  const client = getAnthropicClient();
  const messages = [
    {
      role: ROLES.USER,
      content: input,
    },
  ];

  let roundsLeft = maxRounds;

  while (true) {
    const response = await withLoadingSpinner(
      `${model} is thinking...`,
      () =>
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

      roundsLeft = maxRounds;
      continue;
    }

    if (response.stop_reason === "max_tokens") {
      return "Agent stopped because maximum tokens were reached.";
    }

    return extractTextBlocks(response.content);
  }
};

const runAgent = async (userMessage, options = {}) => {
  const selectedAgent = appState.getSelectedAgent();
  if (!selectedAgent || typeof selectedAgent.run !== "function") {
    throw new Error("No runnable agent selected.");
  }

  return selectedAgent.run(userMessage, options);
};

const runTaskAgent = async (task, options = {}) => {
  print(ROLES.SYSTEM, `executing task: ${task}.\n`);

  const selectedAgent = appState.getSelectedAgent();
  if (!selectedAgent) {
    throw new Error("No agent selected for task execution.");
  }

  if (typeof selectedAgent.runTask === "function") {
    return selectedAgent.runTask(task, options);
  }

  return selectedAgent.run(task, options);
};

const MODELS = [
  {
    id: "claude",
    mode: "claude",
    name: "Claude",
    description:
      "Uses Anthropic Claude with native tool-calling and planning-aware execution.",
    apiKey: process.env.ANTHROPIC_API_KEY,
    requiresApiKey: true,
    run: async (input, options = {}) => {
      return runClaudeFlow(input, {
        ...options,
        systemPrompt: SYSTEM_PROMPT,
      });
    },
    runTask: async (task, options = {}) => {
      return runClaudeFlow(task, {
        model: options.model || DEFAULT_CLAUDE_MODEL,
        maxRounds: options.maxRounds,
        systemPrompt: TASK_SYSTEM_PROMPT,
      });
    },
  },
  {
    id: "llama-native",
    mode: "llama",
    name: "Native Llama (Ollama)",
    description:
      "Uses a local Ollama Llama model with tool loops for questions and task execution.",
    apiKey: null,
    requiresApiKey: false,
    run: async (input, options = {}) => {
      return runOllamaFlow(input, {
        model: options.model || DEFAULT_OLLAMA_MODEL,
        maxRounds: options.maxRounds,
        systemPrompt: SYSTEM_PROMPT,
      });
    },
    runTask: async (task, options = {}) => {
      return runOllamaFlow(task, {
        model: options.model || DEFAULT_OLLAMA_TASK_MODEL,
        maxRounds: options.maxRounds,
        systemPrompt: TASK_SYSTEM_PROMPT,
      });
    },
  },
];

export { runAgent, runTaskAgent, MODELS };
