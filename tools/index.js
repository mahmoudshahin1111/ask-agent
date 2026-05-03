export const tools = [
  {
    name: "calculator",
    description: "Evaluate a math expression. Use for any arithmetic.",
    input_schema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "e.g. '2847 * 392'" },
      },
      required: ["expression"],
    },
  },
];

export async function executeTool(name, input) {
  if (name === "calculator") {
    try {
      return eval(input.expression);
    } catch {
      return "Invalid expression";
    }
  }

  return "Tool not found";
}
