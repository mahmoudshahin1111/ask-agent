import ollama from "ollama";
import { tools, executeTool } from "./tools/index.js";
import readline from "readline";
import { config } from "dotenv";
import { print, logger, getColorBasedOnRole } from "./utils/index.js";

config();

const MODEL = process.env.OLLAMA_MODEL || "llama3.1";

const SYSTEM_PROMPT = `
You are a function-first assistant. You answer requests by calling tools — never by computing or guessing results yourself.

Available tools:
- add: plus (+), sum, add
- subtract: minus (-), subtract, difference
- multiply: times (*, x), multiply, product
- divide: divide (/), quotient
- get_current_time: current time, what time is it

Rules:
1. Always call the appropriate tool instead of answering directly.
2. You may call multiple tools in a single response when the user asks for more than one operation, for example: "add 2+3 and multiply 4*5" should call both add and multiply.
3. Call tools in parallel whenever their inputs are independent of each other.
4. Only call a tool sequentially (one after another) when the output of one is needed as input to the next, for example: "add 2+3 then multiply the result by 4".
5. For math tools, extract exactly two numeric inputs and pass them as {"a": number, "b": number}.
6. For get_current_time, pass no inputs.
7. If inputs are missing or unclear, ask a short clarification question instead of guessing.
8. If division by zero is requested, call divide anyway and report the tool error clearly.
9. Keep responses concise.

`;

const messages = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
];

async function runAgent(userMessage) {
  let keepRunning = true;
  let maxRounds = 5; // Prevent infinite loops

  messages.push({
    role: "user",
    content: userMessage,
  });

  while (keepRunning) {
    const response = await ollama.chat({
      model: MODEL,
      messages,
      tools,
    });

    const message = response.message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      print("agent", message.content);
      break;
    }

    messages.push(message);

    for (const toolCall of message.tool_calls) {
      logger.debug(`Tool call: ${toolCall.function.name} with arguments ${JSON.stringify(toolCall.function.arguments)}`);
      const { name, arguments: args } = toolCall.function;
      print("tool", `${name}`);

      const result = await executeTool(name, args);

      messages.push({
        role: "tool",
        content: String(result),
      });
    }

    maxRounds--;
    if (maxRounds <= 0) {
      print(
        "system",
        "Maximum tool calls reached. Should end the conversation (y/n)?\n",
      );
      const answer = await new Promise((resolve) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        rl.question(
          `${getColorBasedOnRole("system", "Your")} answer: `,
          (input) => {
            rl.close();
            resolve(input.trim().toLowerCase());
          },
        );
      });
      if (answer === "y" || answer === "yes") {
        keepRunning = false;
      } else {
        maxRounds = 5; // Reset the counter if the user wants to continue
      }
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const ask = () =>
  rl.question(`${getColorBasedOnRole("user", "You")}: `, async (input) => {
    if (input.toLowerCase() === "/bye") {
      rl.close();
      return;
    }
    await runAgent(input);
    ask();
  });

print(
  "system",
  "Welcome to Ask Agent, your function-first calculator assistant, let's get started or type /bye to exit. \n",
);
ask();
