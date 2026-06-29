import { add, divide, multiply, subtract } from "./calculator.js";
import { getCurrentTime } from "./datetime.js";
import { search } from "./search.js";
import { breakIntoSubtasks, compileReport, executeSubtask } from "./task.js";

const PLANNING_FALLBACK_NAMES = new Set([
  "break_into_subtasks",
  "execute_subtask",
  "compile_report",
]);

const executeToolByName = async (name, input) => {
  if (name?.toLowerCase() === "add") {
    try {
      return add(input.a, input.b);
    } catch {
      return "Invalid input";
    }
  }

  if (name?.toLowerCase() === "subtract") {
    try {
      return subtract(input.a, input.b);
    } catch {
      return "Invalid input";
    }
  }

  if (name?.toLowerCase() === "multiply") {
    try {
      return multiply(input.a, input.b);
    } catch {
      return "Invalid input";
    }
  }

  if (name?.toLowerCase() === "divide") {
    try {
      return divide(input.a, input.b);
    } catch {
      return "Invalid input";
    }
  }

  if (name?.toLowerCase() === "get_current_time") {
    try {
      return getCurrentTime();
    } catch {
      return "Could not retrieve current time";
    }
  }

  if (name?.toLowerCase() === "search") {
    try {
      return await search(input.query);
    } catch {
      return "Could not perform search";
    }
  }

  if (name?.toLowerCase() === "planning:break_into_subtasks") {
    try {
      return breakIntoSubtasks(input);
    } catch {
      return "Could not break into subtasks";
    }
  }

  if (name?.toLowerCase() === "planning:execute_subtask") {
    try {
      return await executeSubtask(input);
    } catch {
      return "Could not execute subtask";
    }
  }

  if (name?.toLowerCase() === "planning:compile_report") {
    try {
      return await compileReport(input);
    } catch {
      return "Could not compile report";
    }
  }

  return "Tool not found";
};

const executeTool = async (toolName, args) => {
  const normalizedName = toolName?.toLowerCase();
  const result = await executeToolByName(normalizedName, args);

  if (result !== "Tool not found") {
    return result;
  }

  if (!PLANNING_FALLBACK_NAMES.has(normalizedName)) {
    return result;
  }

  return executeToolByName(`planning:${normalizedName}`, args);
};

export { executeTool };
