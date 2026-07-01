import { ROLES } from "./constants.js";

const ROLE_LABELS = {
  [ROLES.USER]: "User",
  [ROLES.AGENT]: "Agent",
  [ROLES.TOOL]: "Tool Call",
  [ROLES.SYSTEM]: "System",
};

const SPINNER_FRAMES = ["|", "/", "-", "\\"];
const SPINNER_INTERVAL_MS = 80;

const getRoleLabel = (role) => ROLE_LABELS[role] || "Unknown";

const print = (role, content) => {
  console.log(`${getTextWithRole(role, content)}\n`);
};

const getTextWithRole = (role, content) => {
  return `${getColorBasedOnRole(role, getRoleLabel(role))}: ${content ?? ""}`;
};

const getColorBasedOnRole = (role, content) => {
  const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
  };

  const color =
    role === ROLES.USER
      ? "green"
      : role === ROLES.AGENT
        ? "blue"
        : role === ROLES.TOOL
          ? "yellow"
          : "red";

  const reset = "\x1b[0m";
  const colorCode = colors[color] || "";
  return `${colorCode}${content}${reset}`;
};

const startLoadingSpinner = (message) => {
  if (!process.stdout.isTTY) {
    return () => {};
  }

  let frameIndex = 0;
  process.stdout.write(`\r${SPINNER_FRAMES[frameIndex]} ${message}`);

  const timer = setInterval(() => {
    frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
    process.stdout.write(`\r${SPINNER_FRAMES[frameIndex]} ${message}`);
  }, SPINNER_INTERVAL_MS);

  return () => {
    clearInterval(timer);
    process.stdout.write("\r\x1b[K");
  };
};

const executeOperation = async (message, operation) => {
  const stopSpinner = startLoadingSpinner(message);

  try {
    return await operation();
  } finally {
    stopSpinner();
  }
};

export {
  print,
  getColorBasedOnRole,
  getTextWithRole,
  startLoadingSpinner,
  executeOperation,
};