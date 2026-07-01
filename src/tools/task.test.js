import { describe, it, expect, vi, beforeEach } from "vitest";

const { confirm, print, runTaskAgent, memory } = vi.hoisted(() => ({
  confirm: vi.fn(),
  print: vi.fn(),
  runTaskAgent: vi.fn(),
  memory: {
    setGoal: vi.fn(),
    addSubtasks: vi.fn(),
    addResult: vi.fn(),
    getSummary: vi.fn(),
    reset: vi.fn(),
  },
}));

vi.mock("@inquirer/prompts", () => ({ confirm }));
vi.mock("../utils/index.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  print,
  ROLES: { AGENT: "agent" },
  runTaskAgent,
  memory,
}));

import { breakIntoSubtasks, executeSubtask, compileReport } from "./task.js";

describe("planning task tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("breakIntoSubtasks", () => {
    it("stores the goal and subtasks in memory", () => {
      const input = {
        goal: "Prepare release",
        subtasks: ["Run tests", "Build package", "Publish changelog"],
      };

      const result = breakIntoSubtasks(input);

      expect(memory.setGoal).toHaveBeenCalledWith("Prepare release");
      expect(memory.addSubtasks).toHaveBeenCalledWith(input.subtasks);
      expect(print).toHaveBeenCalled();
      expect(result).toBe(
        "Subtasks registered: Run tests | Build package | Publish changelog",
      );
    });
  });

  describe("executeSubtask", () => {
    it("executes an approved subtask and stores the result", async () => {
      confirm.mockResolvedValue(true);
      runTaskAgent.mockResolvedValue("Tests passed");

      const result = await executeSubtask({
        subtask: "Run tests",
        context: "Release branch is cut",
      });

      expect(confirm).toHaveBeenCalledWith({
        message: "Execute this subtask now?\nRun tests",
        default: true,
      });
      expect(runTaskAgent).toHaveBeenCalledWith(
        expect.stringContaining("Task: Run tests"),
      );
      expect(runTaskAgent).toHaveBeenCalledWith(
        expect.stringContaining("Context from previous steps: Release branch is cut"),
      );
      expect(memory.addResult).toHaveBeenCalledWith("Run tests", "Tests passed");
      expect(result).toBe("Tests passed");
    });

    it("supports object responses from the task agent", async () => {
      confirm.mockResolvedValue(true);
      runTaskAgent.mockResolvedValue({ content: [{ text: "Built artifact" }] });

      const result = await executeSubtask({ subtask: "Build package" });

      expect(memory.addResult).toHaveBeenCalledWith(
        "Build package",
        "Built artifact",
      );
      expect(result).toBe("Built artifact");
    });

    it("stops the workflow when the user declines execution", async () => {
      confirm.mockResolvedValue(false);

      const result = await executeSubtask({ subtask: "Deploy release" });

      expect(memory.reset).toHaveBeenCalled();
      expect(runTaskAgent).not.toHaveBeenCalled();
      expect(result).toContain("User declined subtask execution");
      expect(result).toContain("call compile_report immediately");
    });
  });

  describe("compileReport", () => {
    it("returns a stopped-workflow message when there are no results", async () => {
      memory.getSummary.mockReturnValue("");

      const result = await compileReport({ title: "Release report" });

      expect(result).toContain("No subtasks were executed");
    });

    it("returns the collected summary when results exist", async () => {
      memory.getSummary.mockReturnValue("Step 1 — Run tests:\nTests passed");

      const result = await compileReport({ title: "Release report" });

      expect(result).toBe("\n📊 Final Report:\nStep 1 — Run tests:\nTests passed");
    });
  });
});