import { confirm } from "@inquirer/prompts";
import { getTextWithRole } from "../../utils/print.js";
import { ROLES } from "../../utils/constants.js";

const askToContinueAfterLimit = async () => {
  const shouldEnd = await confirm({
    message: getTextWithRole(
      ROLES.SYSTEM,
      "Maximum tool rounds reached. End conversation?",
    ),
    default: true,
  });

  return !shouldEnd;
};

export { askToContinueAfterLimit };