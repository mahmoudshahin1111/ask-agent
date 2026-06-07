import { add, divide, multiply, subtract } from "./calculator.js";
import { getCurrentTime } from "./datetime.js";
import { search } from "./search.js";
import { breakIntoSubtasks, compileReport, executeSubtask } from "./task.js";

const executeTool = async (name, input) => {
  if (name === "add") {
    try {
      return add(input.a, input.b);
    } catch {
      return "Invalid input";
    }
  }

  if (name === "subtract") {
    try {
      return subtract(input.a, input.b);
    } catch {
      return "Invalid input";
    }
  }

  if (name === "multiply") {
    try {
      return multiply(input.a, input.b);
    } catch {
      return "Invalid input";
    }
  }

  if (name === "divide") {
    try {
      return divide(input.a, input.b);
    } catch {
      return "Invalid input";
    }
  }

  if (name === "get_current_time") {
    try {
      return getCurrentTime();
    } catch {
      return "Could not retrieve current time";
    }
  }

  if (name === "search") {
    try {
      return await search(input.query);
    } catch {
      return "Could not perform search";
    }
  }

  if (name === "Planning:break_into_subtasks") {
    try {
      return breakIntoSubtasks(input);
    } catch {
      return "Could not break into subtasks";
    }
  }

  if (name === "Planning:execute_subtask") {
    try {
      return await executeSubtask(input);
    } catch {
      return "Could not execute subtask";
    }
  }

  if (name === "Planning:compile_report") {
    try {
      return await compileReport(input);
    } catch {
      return "Could not compile report";
    }
  }

  return "Tool not found";
};

export { executeTool };
