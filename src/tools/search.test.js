import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tavily/core", () => ({
  tavily: vi.fn(),
}));

vi.mock("../utils/index.js", () => ({
  logger: { error: vi.fn() },
}));

import { tavily } from "@tavily/core";
import { logger } from "../utils/index.js";
import { search } from "./search.js";

const mockSearch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  tavily.mockReturnValue({ search: mockSearch });
  process.env.TAVILY_API_KEY = "test-api-key";
});

describe("search", () => {
  it("returns formatted results for a valid query", async () => {
    mockSearch.mockResolvedValue({
      results: [
        { score: 0.95, title: "Result A", content: "Content A", url: "https://a.com" },
        { score: 0.80, title: "Result B", content: "Content B", url: "https://b.com" },
      ],
    });

    const output = await search("test query");

    expect(output).toContain("Result 1:");
    expect(output).toContain("Title: Result A");
    expect(output).toContain("Score: 0.95");
    expect(output).toContain("Content: Content A");
    expect(output).toContain("URL: https://a.com");
    expect(output).toContain("Result 2:");
    expect(output).toContain("Title: Result B");
  });

  it("initialises the client with the TAVILY_API_KEY env variable", async () => {
    mockSearch.mockResolvedValue({ results: [] });

    await search("anything");

    expect(tavily).toHaveBeenCalledWith({ apiKey: "test-api-key" });
  });

  it("passes the query to the tavily client", async () => {
    mockSearch.mockResolvedValue({ results: [] });

    await search("latest news");

    expect(mockSearch).toHaveBeenCalledWith("latest news", { maxResults: 3 });
  });

  it("returns an empty string when results array is empty", async () => {
    mockSearch.mockResolvedValue({ results: [] });

    const output = await search("no results query");

    expect(output).toBe("");
  });

  it("returns an error message and logs when the client throws", async () => {
    mockSearch.mockRejectedValue(new Error("network failure"));

    const output = await search("failing query");

    expect(output).toBe("An error occurred while performing the search.");
    expect(logger.error).toHaveBeenCalledWith("Search tool error: network failure");
  });

  it("handles a response with no results property gracefully", async () => {
    mockSearch.mockResolvedValue({});

    const output = await search("undefined results");

    expect(output).toBe("");
  });
});
