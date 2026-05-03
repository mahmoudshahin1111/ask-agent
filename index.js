import ollama from "ollama";
import { tools, executeTool } from "./tools/index.js";
import readline from "readline";
import { config } from "dotenv";

config();

const MODEL = process.env.OLLAMA_MODEL || "llama3.1";

const SYSTEM_PROMPT =
  "You are a helpful assistant that can use tools to answer questions." +
  " don't make up tool calls, only call a tool if you need information to answer the user's question." +
  " Always use the tools when needed, don't try to answer questions you don't have enough information for." +
  " The tools you have access to are:" +
  "calculator: Evaluate a math expression. Use for any arithmetic." +
  "datetime: Get the current date and time." +
  "When you call a tool, provide only the necessary information as arguments. For example, if you want to get the current date and time, you would call the datetime tool without any arguments." +
  "If you need to do a calculation, use the calculator tool with the expression as an argument. For example, if you want to calculate 2 + 2, you would call the calculator tool with the expression '2 + 2'." +
  "Answer the user's question as best as you can using the tools when necessary.";

async function runAgent(userMessage) {
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    { role: "user", content: userMessage },
  ];

  while (true) {
    const response = await ollama.chat({
      model: MODEL,
      messages,
      tools,
    });

    const message = response.message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      console.log(`Agent: ${message.content}\n`);
      break;
    }

    messages.push(message);

    for (const toolCall of message.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      console.log(`→ Using tool: ${name}`);

      const result = await executeTool(name, args);

      messages.push({
        role: "tool",
        content: String(result),
      });
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const ask = () =>
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === "/bye") {
      rl.close();
      return;
    }
    await runAgent(input);
    ask();
  });

ask();
