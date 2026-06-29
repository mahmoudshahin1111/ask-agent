import ollama from "ollama";
import { config } from "dotenv";
import readline from "readline";
import { getColorBasedOnRole, print } from "./print.js";
import { logger } from "./logger.js";
import { ROLES } from "./constants.js";
import { executeTool, tools } from "../tools/index.js";
import { memory } from "./memory.js";
import Anthropic from "@anthropic-ai/sdk";
import { appState } from "../state/index.js";
import { confirm } from "@inquirer/prompts";

config();

const SYSTEM_PROMPT = `
  You are a function-first assistant. You NEVER compute, guess, or answer directly —
you always call the appropriate tool and return its result.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Math (inputs: { "a": number, "b": number })
  add          — addition
  subtract     — subtraction
  multiply     — multiplication
  divide       — division (if user requests ÷0, call divide and surface the error as-is)

Lookup (no inputs)
  get_current_time — returns the current time

Search (inputs: { "query": string })
  search       — web search for facts, current events, or anything outside your knowledge

Planning (for multi-step goals)
  break_into_subtasks  — decomposes a complex goal into an ordered list of subtasks
  execute_subtask      — executes one subtask; always pass prior subtask results as context
  compile_report       — assembles all subtask results into a final response

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION LOGIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Choose the mode that fits the request:

SIMPLE MODE — a single operation (math, time, one-off lookup)
  → Call the matching tool directly and return its result.

SEARCH MODE — facts, current events, or anything you don't know with certainty
  → Call search. Do not answer from memory if the answer could be outdated or wrong.

PLANNING MODE — a goal or task that requires multiple steps
  → You MUST follow this exact sequence:
     1. Call break_into_subtasks to get the subtask list
     2. Call execute_subtask once per subtask, passing previous results as context
     3. Call compile_report to produce the final output
  Never skip steps or answer a planning request directly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CALLING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Always use exact tool names — never synonyms or variations.
2. Call tools in parallel when their inputs are independent.
3. Call tools sequentially only when one output feeds the next input.
4. If inputs are missing or ambiguous, ask one short clarification question. Do not guess.
5. Keep all responses concise — report the tool result, not your reasoning.
`;

const runAgent = async (userMessage, { maxRounds } = {}) => {
  if (appState.getSelectedAgent().id === "claude") {
    let keepRunning = true;
    let rounds = 5; // Prevent infinite loops

    const messages = [
      {
        role: "user",
        content: userMessage,
      },
    ];

    while (keepRunning) {
      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        system: [{ type: "text", text: SYSTEM_PROMPT }],
        messages,
        tools,
      });
      print(JSON.stringify(response, null, 2));
      if (!response.stop_reason === "end_turn") {
        print(ROLES.AGENT, message.content);
        let text = "";
        for (const block of response.content) {
          // if it is a text block appended if it's a tool execute the tool and append the result text.
          if (block.type === "text") {
            text += block.text;
          }
        }
        return text;
      } else if (response.stop_reason === "tool_use") {
        // execute the tool and send the response back to the model as a tool response and continue the conversation.
        const toolCalls = response.content.filter(
          (block) => block.type === "tool_use",
        );
        for (const toolCall of toolCalls) {
          logger.debug(
            `Tool call: ${toolCall.name} with arguments ${JSON.stringify(toolCall.input)}`,
          );
          const { id, name, input: args } = toolCall;
          const result = await executeTool(name, args);
          messages.push({
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: id,
                content: String(result),
              },
            ],
          });
        }

        console.log(response.content);
      } else if (response.stop_reason === "max_tokens") {
        print(
          ROLES.SYSTEM,
          "Maximum tokens reached for this response. Should continue the conversation (y/n)?\n",
        );
        return "Agent stopped by user after reaching maximum tokens.";
      }

      rounds--;
      if (rounds <= 0) {
        print(
          ROLES.SYSTEM,
          "Maximum tool calls reached. Should end the conversation (y/n)?\n",
        );
        const answer = await new Promise((resolve) => {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });
          rl.question(
            `${getColorBasedOnRole(ROLES.SYSTEM, "Your")} answer: `,
            (input) => {
              rl.close();
              resolve(input.trim().toLowerCase());
            },
          );
        });
        if (answer === "y" || answer === "yes") {
          return "Agent stopped by user after reaching maximum tool calls.";
        } else {
          rounds = 5;
        }
      }
    }
  } else {
    let keepRunning = true;
    let rounds = 5; // Prevent infinite loops

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    while (keepRunning) {
      const response = await ollama.chat({
        model: MODEL,
        messages,
        tools,
      });

      const message = response.message;

      if (!message.tool_calls || message.tool_calls.length === 0) {
        print(ROLES.AGENT, message.content);
        return message.content;
      }

      messages.push(message);

      for (const toolCall of message.tool_calls) {
        logger.debug(
          `Tool call: ${toolCall.function.name} with arguments ${JSON.stringify(toolCall.function.arguments)}`,
        );
        const { name, arguments: args } = toolCall.function;
        print(
          ROLES.TOOL,
          `executing tool: ${name} with args: ${JSON.stringify(args)}`,
        );

        const result = await executeTool(name, args);

        messages.push({
          role: ROLES.TOOL,
          content: String(result),
        });
      }

      rounds--;
      if (rounds <= 0) {
        print(
          ROLES.SYSTEM,
          "Maximum tool calls reached. Should end the conversation (y/n)?\n",
        );
        const answer = await new Promise((resolve) => {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });
          rl.question(
            `${getColorBasedOnRole(ROLES.SYSTEM, "Your")} answer: `,
            (input) => {
              rl.close();
              resolve(input.trim().toLowerCase());
            },
          );
        });
        if (answer === "y" || answer === "yes") {
          return "Agent stopped by user after reaching maximum tool calls.";
        } else {
          rounds = 5;
        }
      }
    }
  }
};

const runTaskAgent = async (task, { maxRounds } = {}) => {
  print(ROLES.SYSTEM, `executing task: ${task}.\n`);
  const messages = [
    {
      role: ROLES.SYSTEM,
      content: `you are a task agent that breaks down complex tasks into subtasks and executes them sequentially. Always break down the task into clear, actionable subtasks, execute them one by one, and use the results of previous subtasks as context for the next ones. If a subtask requires information you don't have, use the search tool to find it. Always provide concise results for each subtask and keep track of the overall goal.`,
    },
    {
      role: ROLES.USER,
      content: task,
    },
  ];

  let running = true;
  let rounds = 0;

  while (running) {
    const response = await ollama.chat({
      model: SMALL_MODEL,
      messages,
      tools,
    });

    const message = response.message;
    thinking(message.content);
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return `call the Planning:compile_report tool to finish the task and get the final report. with the content: ${message.content}`;
    }

    messages.push(message);

    for (const toolCall of message.tool_calls) {
      logger.debug(
        `Tool call: ${toolCall.function.name} with arguments ${JSON.stringify(toolCall.function.arguments)}`,
      );
      const { name, arguments: args } = toolCall.function;
      print(
        ROLES.TOOL,
        `executing tool: ${name} with args: ${JSON.stringify(args)}`,
      );

      const result = await executeTool(name, args);

      messages.push({
        role: ROLES.TOOL,
        content: String(result),
      });
    }

    rounds++;
    if (maxRounds && rounds >= maxRounds) {
      print(
        ROLES.SYSTEM,
        `Maximum rounds of tool calls reached. Ending task execution.\n`,
      );
      running = false;
    }
  }
  print(ROLES.SYSTEM, `ended executing task: ${task}.\n`);
  return response.message.content;
};

const thinking = (message) => {
  print(ROLES.AGENT, `Thinking:  ${message}`);
};

const MODELS = [
  {
    id: "claude",
    name: "Claude",
    description:
      "A helpful assistant that can perform calculations and answer questions.",
    apiKey: process.env.ANTHROPIC_API_KEY,
    run: async (input) => {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      let keepRunning = true;
      let rounds = 5; // Prevent infinite loops

      const messages = [
        {
          role: "user",
          content: input,
        },
      ];
      console.log("agent is running with a user message", input);

      // while (keepRunning) {
      //   const response = await client.messages.create({
      //     model: "claude-opus-4-8",
      //     max_tokens: 1024,
      //     system: [{ type: "text", text: SYSTEM_PROMPT }],
      //     messages,
      //     tools,
      //   });

      //   if (!response.stop_reason === "end_turn") {
      //     print(ROLES.AGENT, message.content);
      //     let text = "";
      //     for (const block of response.content) {
      //       // if it is a text block appended if it's a tool execute the tool and append the result text.
      //       if (block.type === "text") {
      //         text += block.text;
      //       }
      //     }
      //     return text;
      //   } else if (response.stop_reason === "tool_use") {
      //     // execute the tool and send the response back to the model as a tool response and continue the conversation.
      //     const toolCalls = response.content.filter(
      //       (block) => block.type === "tool_use",
      //     );
      //     for (const toolCall of toolCalls) {
      //       logger.debug(
      //         `Tool call: ${toolCall.name} with arguments ${JSON.stringify(toolCall.input)}`,
      //       );
      //       const { id, name, input: args } = toolCall;
      //       const result = await executeTool(name, args);
      //       messages.push({
      //         role: "user",
      //         content: [
      //           {
      //             type: "tool_result",
      //             tool_use_id: id,
      //             content: String(result),
      //           },
      //         ],
      //       });
      //     }

      //     console.log(response.content);
      //   } else if (response.stop_reason === "max_tokens") {
      //     print(
      //       ROLES.SYSTEM,
      //       "Maximum tokens reached for this response. Should continue the conversation (y/n)?\n",
      //     );
      //     return "Agent stopped by user after reaching maximum tokens.";
      //   }
      // }
    },
  },
  {
    id: "llama3.1",
    name: "LLaMA 3.1",
    description:
      "A versatile model that can handle a wide range of tasks with good performance.",
    run: async (input) => {},
  },
  {
    id: "gemma4:e2b",
    name: "Gemma 4 (2B)",
    description:
      "A powerful model that can handle complex tasks and provide detailed responses.",
    run: async (input) => {
      let keepRunning = true;
      let rounds = 5; // Prevent infinite loops

      const messages = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: input,
        },
      ];

      while (keepRunning) {
        const response = await ollama.chat({
          model: "gemma4:e2b",
          messages,
          tools,
        });

        const message = response.message;

        if (!message.tool_calls || message.tool_calls.length === 0) {
          print(ROLES.AGENT, message.content);
          return message.content;
        }

        messages.push(message);

        for (const toolCall of message.tool_calls) {
          logger.debug(
            `Tool call: ${toolCall.function.name} with arguments ${JSON.stringify(toolCall.function.arguments)}`,
          );
          const { name, arguments: args } = toolCall.function;
          print(
            ROLES.TOOL,
            `executing tool: ${name} with args: ${JSON.stringify(args)}`,
          );

          const result = await executeTool(name, args);

          messages.push({
            role: ROLES.TOOL,
            content: String(result),
          });
        }

        rounds--;
        if (rounds <= 0) {
          print(
            ROLES.SYSTEM,
            "Maximum tool calls reached. Should end the conversation (y/n)?\n",
          );
          const answer = await confirm({
            message: getTextWithRole(
              ROLES.SYSTEM,
              "Maximum tool calls reached. End conversation?",
            ),
            default: "y/n",
          });
          if (answer === "y" || answer === "yes") {
            return "Agent stopped by user after reaching maximum tool calls.";
          } else {
            rounds = 5;
          }
        }
      }
    },
  },
  {
    id: "qwen2.5:0.5b",
    name: "Qwen 2.5 (0.5B)",
    description:
      "A smaller, faster model that is ideal for simple tasks and quick responses.",
  },
];

export { runAgent, runTaskAgent, MODELS };
