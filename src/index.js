import readline from "readline";
import { config } from "dotenv";
import { print, logger, getColorBasedOnRole, runAgent, memory } from "./utils/index.js";

config();

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
    memory.reset(); // Clear memory for each new question
    await runAgent(input);
    ask();
  });

print(
  "system",
  "Welcome to Ask Agent, your function-first calculator assistant, let's get started or type /bye to exit. \n",
);
ask();
