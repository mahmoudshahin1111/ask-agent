const parseToolArguments = (args) => {
  if (!args) return {};

  if (typeof args === "string") {
    try {
      return JSON.parse(args);
    } catch {
      return {};
    }
  }

  if (typeof args === "object") return args;
  return {};
};

export { parseToolArguments };