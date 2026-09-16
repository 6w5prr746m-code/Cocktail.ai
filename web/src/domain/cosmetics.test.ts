import { describe, expect, it } from "vitest";
import { isSkinUnlocked, SKINS } from "./cosmetics";

describe("isSkinUnlocked", () => {
  it("the default skin is always unlocked", () => {
    const or = SKINS.find((s) => s.id === "or")!;
    expect(isSkinUnlocked(or, 0)).toBe(true);
  });

  it("a skin locks below its badge threshold and unlocks at/above it", () => {
    const emeraude = SKINS.find((s) => s.id === "emeraude")!;
    expect(isSkinUnlocked(emeraude, 2)).toBe(false);
    expect(isSkinUnlocked(emeraude, 3)).toBe(true);
    expect(isSkinUnlocked(emeraude, 4)).toBe(true);
  });
});
