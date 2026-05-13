import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCurrentTime } from "./datetime.js";

describe("getCurrentTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a non-empty string", () => {
    expect(typeof getCurrentTime()).toBe("string");
    expect(getCurrentTime().length).toBeGreaterThan(0);
  });

  it("returns the current local time as a locale time string", () => {
    const fixedDate = new Date("2026-05-14T15:30:45");
    vi.setSystemTime(fixedDate);

    expect(getCurrentTime()).toBe(fixedDate.toLocaleTimeString());
  });

  it("reflects time changes", () => {
    vi.setSystemTime(new Date("2026-05-14T08:00:00"));
    const first = getCurrentTime();

    vi.setSystemTime(new Date("2026-05-14T09:00:00"));
    const second = getCurrentTime();

    expect(first).not.toBe(second);
  });
});
