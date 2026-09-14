import { describe, expect, it } from "vitest";
import { formatDifficulty, formatDuration, formatPercent, formatQuantity } from "./formatting";

describe("formatQuantity", () => {
  it("drops the trailing .0 on whole numbers", () => {
    expect(formatQuantity(6)).toBe("6");
    expect(formatQuantity(6.0)).toBe("6");
  });

  it("keeps a clean decimal as-is", () => {
    expect(formatQuantity(0.5)).toBe("0.5");
    expect(formatQuantity(2.5)).toBe("2.5");
  });

  it("rounds to two decimal places", () => {
    expect(formatQuantity(1.005)).toBe("1");
    expect(formatQuantity(1.006)).toBe("1.01");
  });
});

describe("formatDifficulty", () => {
  it("maps 1/2/3 to Facile/Intermédiaire/Avancé", () => {
    expect(formatDifficulty(1)).toBe("Facile");
    expect(formatDifficulty(2)).toBe("Intermédiaire");
    expect(formatDifficulty(3)).toBe("Avancé");
  });
});

describe("formatDuration", () => {
  it("appends min", () => {
    expect(formatDuration(4)).toBe("4 min");
  });
});

describe("formatPercent", () => {
  it("rounds a fraction to a whole percent", () => {
    expect(formatPercent(0.75)).toBe("75%");
    expect(formatPercent(0.376)).toBe("38%");
  });
});
