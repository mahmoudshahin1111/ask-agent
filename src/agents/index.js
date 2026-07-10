import { config } from "dotenv";
import { ROLES } from "../utils/constants.js";
import { print } from "../utils/print.js";
import { appState } from "../state/index.js";
import { createClaudeModel } from "./models/claude-model.js";
import { createLlamaModel } from "./models/llama-model.js";

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

const TASK_EXECUTER_SYSTEM_PROMPT = `
You are a task executer.
Execute the user task directly using ONLY the tools provided to you in this session.

STRICT RULES
1) Do not use planning workflow tools.
2) Do not invent or assume tool names that were not provided.
3) If a required capability is missing from the available tools, stop immediately and ask the user whether to continue without it.
4) In that stop message, include the exact missing tool name you need.
5) Keep execution output concise and accurate.
`;

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

  if (typeof selectedAgent.runTaskExecuter === "function") {
    return selectedAgent.runTaskExecuter(task, options);
  }

  if (typeof selectedAgent.runTask === "function") {
    return selectedAgent.runTask(task, options);
  }

  return selectedAgent.run(task, options);
};

const MODELS = [
  createClaudeModel({
    apiKey: process.env.ANTHROPIC_API_KEY,
    getApiKey: () =>
      appState.getSelectedAgentApiKey?.() || process.env.ANTHROPIC_API_KEY,
    systemPrompt: SYSTEM_PROMPT,
    taskSystemPrompt: TASK_SYSTEM_PROMPT,
    taskExecuterSystemPrompt: TASK_EXECUTER_SYSTEM_PROMPT,
    defaultModel: DEFAULT_CLAUDE_MODEL,
    defaultMaxRounds: DEFAULT_MAX_ROUNDS,
  }),
  createLlamaModel({
    systemPrompt: SYSTEM_PROMPT,
    taskSystemPrompt: TASK_SYSTEM_PROMPT,
    defaultModel: DEFAULT_OLLAMA_MODEL,
    defaultTaskModel: DEFAULT_OLLAMA_TASK_MODEL,
    defaultMaxRounds: DEFAULT_MAX_ROUNDS,
  }),
];

export { runAgent, runTaskAgent, MODELS };