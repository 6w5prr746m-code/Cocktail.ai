import { describe, expect, it } from "vitest";
import { fuzzyIncludes } from "./fuzzySearch";

describe("fuzzyIncludes", () => {
  it("matches a plain substring case-insensitively", () => {
    expect(fuzzyIncludes("moji", "Mojito")).toBe(true);
    expect(fuzzyIncludes("MOJI", "Mojito")).toBe(true);
  });

  it("is accent-insensitive", () => {
    expect(fuzzyIncludes("cafe", "Café")).toBe(true);
    expect(fuzzyIncludes("café", "Cafe Liqueur")).toBe(true);
  });

  it("matches across a multi-word substring", () => {
    expect(fuzzyIncludes("citron vert", "Citron vert bio")).toBe(true);
  });

  it("tolerates a single-character typo on a word of reasonable length", () => {
    expect(fuzzyIncludes("mojto", "Mojito")).toBe(true);
    expect(fuzzyIncludes("aperoll", "Aperol Spritz")).toBe(true);
  });

  it("does not tolerate typos on very short queries", () => {
    expect(fuzzyIncludes("gn", "Gin")).toBe(false);
  });

  it("rejects unrelated text", () => {
    expect(fuzzyIncludes("whisky", "Mojito")).toBe(false);
  });

  it("treats an empty query as matching everything", () => {
    expect(fuzzyIncludes("", "Mojito")).toBe(true);
    expect(fuzzyIncludes("   ", "Mojito")).toBe(true);
  });
});
