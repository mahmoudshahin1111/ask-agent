import { add, divide, multiply, subtract } from "./calculator.js";
import { getCurrentTime } from "./datetime.js";

 const tools = [
  // calculator tools
  {
    name: "add",
    description:
      "Add two numbers. Call this when the user uses plus, for example: 2+3, 2 + 3, or 'add 2 and 3'.",
    input_schema: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "subtract",
    description:
      "Subtract the second number from the first number. Call this when the user uses minus, for example: 9-4, 9 - 4, or 'subtract 4 from 9'.",
    input_schema: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "multiply",
    description:
      "Multiply two numbers. Call this when the user uses multiply/times, for example: 6*7, 6 x 7, or 'multiply 6 by 7'.",
    input_schema: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "divide",
    description:
      "Divide the first number by the second number. Call this when the user uses divide, for example: 8/2, 8 / 2, or 'divide 8 by 2'.",
    input_schema: {
      type: "object",
      properties: {
        a: { type: "number", description: "Dividend" },
        b: { type: "number", description: "Divisor (must not be 0)" },
      },
      required: ["a", "b"],
    },
  },
  // datetime tool
  {
    name: "get_current_time",
    description:
      "Return the current local time. Call this when the user asks what time it is, for example: 'what time is it?', 'current time', or 'tell me the time'.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

 async function executeTool(name, input) {
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

  return "Tool not found";
}


export {
  tools,
  executeTool,
}