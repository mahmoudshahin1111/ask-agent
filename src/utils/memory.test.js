import { describe, it, expect, beforeEach } from "vitest";
import { memory } from "./memory.js";

describe("memory.getSummary", () => {
  beforeEach(() => {
    memory.reset();
  });

  it("generates a summary containing all prior steps and results", () => {
    memory.addResult("Plan tasks", "Created three subtasks");
    memory.addResult("Execute task 1", "Task 1 completed successfully");
    memory.addResult("Execute task 2", "Task 2 failed with timeout");

    const summary = memory.getSummary();

    expect(summary).toContain("Step 1 — Plan tasks:\nCreated three subtasks");
    expect(summary).toContain("Step 2 — Execute task 1:\nTask 1 completed successfully");
    expect(summary).toContain("Step 3 — Execute task 2:\nTask 2 failed with timeout");

    const sections = summary.split("\n\n");
    expect(sections).toHaveLength(3);
    expect(sections[0]).toBe("Step 1 — Plan tasks:\nCreated three subtasks");
    expect(sections[1]).toBe("Step 2 — Execute task 1:\nTask 1 completed successfully");
    expect(sections[2]).toBe("Step 3 — Execute task 2:\nTask 2 failed with timeout");
  });
});
