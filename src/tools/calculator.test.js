import { describe, it, expect } from "vitest";
import { add, subtract, multiply, divide } from "./calculator.js";

describe("add", () => {
  it("adds two positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("adds a negative and a positive number", () => {
    expect(add(-4, 10)).toBe(6);
  });

  it("adds two negative numbers", () => {
    expect(add(-3, -7)).toBe(-10);
  });

  it("coerces string inputs to numbers", () => {
    expect(add("2", "3")).toBe(5);
  });
});

describe("subtract", () => {
  it("subtracts the second number from the first", () => {
    expect(subtract(9, 4)).toBe(5);
  });

  it("returns a negative result when second is larger", () => {
    expect(subtract(3, 10)).toBe(-7);
  });

  it("subtracts two negative numbers", () => {
    expect(subtract(-5, -3)).toBe(-2);
  });

  it("coerces string inputs to numbers", () => {
    expect(subtract("9", "4")).toBe(5);
  });
});

describe("multiply", () => {
  it("multiplies two positive numbers", () => {
    expect(multiply(6, 7)).toBe(42);
  });

  it("multiplies by zero", () => {
    expect(multiply(5, 0)).toBe(0);
  });

  it("multiplies two negative numbers", () => {
    expect(multiply(-3, -4)).toBe(12);
  });

  it("multiplies a negative and a positive number", () => {
    expect(multiply(-3, 4)).toBe(-12);
  });

  it("coerces string inputs to numbers", () => {
    expect(multiply("6", "7")).toBe(42);
  });
});

describe("divide", () => {
  it("divides two positive numbers", () => {
    expect(divide(8, 2)).toBe(4);
  });

  it("returns a decimal result", () => {
    expect(divide(7, 2)).toBe(3.5);
  });

  it("divides a negative number", () => {
    expect(divide(-12, 4)).toBe(-3);
  });

  it("coerces string inputs to numbers", () => {
    expect(divide("8", "2")).toBe(4);
  });

  it("throws when dividing by zero", () => {
    expect(() => divide(5, 0)).toThrow("Cannot divide by zero.");
  });
});
