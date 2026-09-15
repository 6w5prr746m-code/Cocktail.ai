import { describe, expect, it } from "vitest";
import { computeUnlockedAchievements, type AchievementContext } from "./achievements";

function context(overrides: Partial<AchievementContext> = {}): AchievementContext {
  return {
    totalPrepared: 0,
    longestStreakDays: 0,
    distinctMainSpiritsPrepared: 0,
    favoritesCount: 0,
    myBarIngredientCount: 0,
    userRecipesCount: 0,
    weeklyChallengeEverCompleted: false,
    ...overrides,
  };
}

describe("computeUnlockedAchievements", () => {
  it("unlocks nothing for a brand-new account", () => {
    expect(computeUnlockedAchievements(context())).toEqual([]);
  });

  it("unlocks firstSip but not regular at 1 prepared cocktail", () => {
    const ids = computeUnlockedAchievements(context({ totalPrepared: 1 })).map((a) => a.id);
    expect(ids).toContain("firstSip");
    expect(ids).not.toContain("regular");
  });

  it("unlocks regular and mixologist thresholds independently", () => {
    expect(computeUnlockedAchievements(context({ totalPrepared: 10 })).map((a) => a.id)).toContain("regular");
    expect(computeUnlockedAchievements(context({ totalPrepared: 49 })).map((a) => a.id)).not.toContain("mixologist");
    expect(computeUnlockedAchievements(context({ totalPrepared: 50 })).map((a) => a.id)).toContain("mixologist");
  });

  it("uses the longest streak ever, not the current one, for streak badges", () => {
    const ids = computeUnlockedAchievements(context({ longestStreakDays: 7 })).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(["streak3", "streak7"]));
  });

  it("unlocks challenger only once a weekly challenge has ever been completed", () => {
    expect(computeUnlockedAchievements(context({ weeklyChallengeEverCompleted: false })).map((a) => a.id)).not.toContain("challenger");
    expect(computeUnlockedAchievements(context({ weeklyChallengeEverCompleted: true })).map((a) => a.id)).toContain("challenger");
  });

  it("unlocks creator as soon as a single user recipe exists", () => {
    expect(computeUnlockedAchievements(context({ userRecipesCount: 1 })).map((a) => a.id)).toContain("creator");
  });
});
