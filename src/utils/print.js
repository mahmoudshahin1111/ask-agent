import { ROLES } from "./constants.js";

const print = (role, content) => {
  let roleLabel = "";
  if (role === ROLES.USER) {
    roleLabel = "User";
  } else if (role === ROLES.AGENT) {
    roleLabel = "Agent";
  } else if (role === ROLES.TOOL) {
    roleLabel = "Tool Call";
  } else if (role === ROLES.SYSTEM) {
    roleLabel = "System";
  }

  console.log(`${getColorBasedOnRole(role, roleLabel)}: ${content}\n`);
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

export  {
    print,
    getColorBasedOnRole
}