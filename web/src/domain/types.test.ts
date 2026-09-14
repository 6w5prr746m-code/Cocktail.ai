// Portage de Tests/BarReadinessTests.swift.
import { describe, expect, it } from "vitest";
import { BAR_EXCELLENT_THRESHOLD, evaluateBarReadiness, STOCK_STATUS_ORDER } from "./types";

describe("evaluateBarReadiness", () => {
  it("is empty when there are no ingredients", () => {
    expect(evaluateBarReadiness(0, 0)).toBe("empty");
  });

  it("is almostReady when there are ingredients but nothing unlocked", () => {
    expect(evaluateBarReadiness(2, 0)).toBe("almostReady");
  });

  it("is almostReady just below the excellent threshold", () => {
    expect(evaluateBarReadiness(5, BAR_EXCELLENT_THRESHOLD - 1)).toBe("almostReady");
  });

  it("is excellent exactly at the threshold", () => {
    expect(evaluateBarReadiness(10, BAR_EXCELLENT_THRESHOLD)).toBe("excellent");
  });

  it("is excellent above the threshold", () => {
    expect(evaluateBarReadiness(20, BAR_EXCELLENT_THRESHOLD + 10)).toBe("excellent");
  });
});

describe("STOCK_STATUS_ORDER", () => {
  it("sorts available before low before almostEmpty", () => {
    const sorted = (["almostEmpty", "available", "low"] as const).slice().sort((a, b) => STOCK_STATUS_ORDER[a] - STOCK_STATUS_ORDER[b]);
    expect(sorted).toEqual(["available", "low", "almostEmpty"]);
  });
});
