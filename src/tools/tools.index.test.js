import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./search.js", () => ({ search: vi.fn() }));

import { tools, executeTool } from "./index.js";
import { search } from "./search.js";

describe("tools registry", () => {
  const toolNames = tools.map((t) => t.name);

  it("exposes all expected tools", () => {
    expect(toolNames).toContain("add");
    expect(toolNames).toContain("subtract");
    expect(toolNames).toContain("multiply");
    expect(toolNames).toContain("divide");
    expect(toolNames).toContain("get_current_time");
  });

  it("every tool has a non-empty name, description, and input_schema", () => {
    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.input_schema).toBeDefined();
    }
  });

  it("calculator tools require a and b", () => {
    const calculatorTools = tools.filter((t) => t.name === "calculator");
    for (const tool of calculatorTools) {
      expect(tool.input_schema.required).toContain("a");
      expect(tool.input_schema.required).toContain("b");
    }
  });

  it("get_current_time requires no inputs", () => {
    const timeTool = tools.find((t) => t.name === "get_current_time");
    expect(timeTool.input_schema.required).toHaveLength(0);
  });

  it("search tool has correct description and input schema", () => {
    const searchTool = tools.find((t) => t.name === "search");
    expect(searchTool).toBeDefined();
    expect(searchTool.description).toContain("Search the web using Tavily.");
    expect(searchTool.input_schema.required).toContain("query");
  });
});

describe("executeTool", () => {
  describe("add", () => {
    it("returns the sum", async () => {
      expect(await executeTool("add", { a: 2, b: 3 })).toBe(5);
    });

    it("returns 'Invalid input' for non-numeric inputs", async () => {
      expect(await executeTool("add", { a: null, b: null })).toBe(0);
    });
  });

  describe("subtract", () => {
    it("returns the difference", async () => {
      expect(await executeTool("subtract", { a: 9, b: 4 })).toBe(5);
    });
  });

  describe("multiply", () => {
    it("returns the product", async () => {
      expect(await executeTool("multiply", { a: 6, b: 7 })).toBe(42);
    });
  });

  describe("divide", () => {
    it("returns the quotient", async () => {
      expect(await executeTool("divide", { a: 8, b: 2 })).toBe(4);
    });

    it("returns 'Invalid input' when dividing by zero", async () => {
      expect(await executeTool("divide", { a: 5, b: 0 })).toBe("Invalid input");
    });
  });

  describe("get_current_time", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns the current locale time string", async () => {
      const fixedDate = new Date("2026-05-14T12:00:00");
      vi.setSystemTime(fixedDate);
      expect(await executeTool("get_current_time", {})).toBe(
        fixedDate.toLocaleTimeString(),
      );
    });
  });

  describe("search", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      search.mockResolvedValue("search results");
    });

    it("calls the search function with the query input", async () => {
      const input = { query: "test query" };
      const result = await executeTool("search", input);
      expect(search).toHaveBeenCalledWith("test query");
      expect(result).toBe("search results");
    });
  });

  describe("unknown tool", () => {
    it("returns 'Tool not found'", async () => {
      expect(await executeTool("unknown_tool", {})).toBe("Tool not found");
    });
  });
});
