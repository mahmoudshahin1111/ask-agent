import { logger, print, ROLES } from "../utils/index.js";
import { runTaskAgent} from "../utils/index.js";
import { memory } from "../utils/index.js";

const breakIntoSubtasks = (input) => {
  memory.setGoal(input.goal);
  memory.addSubtasks(input.subtasks);
  let subtaskList = "\n📋 Subtasks: \n";
  input.subtasks.forEach((t, i) => {
    subtaskList += `   ${i + 1}. ${t}\n`;
  });
  print(ROLES.AGENT, subtaskList);
  return `Subtasks registered: ${input.subtasks.join(" | ")}`;
};

const executeSubtask = async (input) => {
  print(ROLES.AGENT, `\n⚙️  Executing: ${input.subtask}`);
  const { subtask, context } = input;
  const response = await runTaskAgent(
    `Complete this task concisely and clearly:\n\nTask: ${subtask}\n\nContext from previous steps: ${context || "none"}`,
  );
  const result =
    typeof response === "string"
      ? response
      : response?.content?.[0]?.text || String(response);
  memory.addResult(input.subtask, result);
  return result;
};

const compileReport = async (input) => {
  const report = memory.getSummary();
  return `\n📊 Final Report:\n${report}`;
};

export { breakIntoSubtasks, executeSubtask, compileReport };
