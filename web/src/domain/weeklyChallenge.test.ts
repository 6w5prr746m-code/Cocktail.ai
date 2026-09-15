import { describe, expect, it } from "vitest";
import { hasCompletedAnyWeeklyChallenge, isChallengeCompletedThisWeek, weeklyChallengePick } from "./weeklyChallenge";
import type { Cocktail } from "./types";
import type { HistoryEntry } from "../state/history";

function cocktail(id: string): Cocktail {
  return {
    id,
    name: id,
    category: "Test",
    origin: "Test",
    history: null,
    difficulty: 1,
    mainSpirit: "Rhum",
    preparationTimeMinutes: 3,
    glassware: "Verre",
    iceType: "Glaçons",
    garnish: "Aucune",
    tips: null,
    imageURL: "",
    ingredients: [],
    steps: [],
    variantIds: [],
    isUserCreated: false,
  };
}

function entry(cocktailId: string, completedAt: string): HistoryEntry {
  return { id: `${cocktailId}-${completedAt}`, cocktailId, completedAt };
}

describe("weeklyChallengePick", () => {
  it("returns undefined for an empty catalog", () => {
    expect(weeklyChallengePick([])).toBeUndefined();
  });

  it("is stable for two dates in the same 7-day bucket", () => {
    const cocktails = [cocktail("A"), cocktail("B"), cocktail("C"), cocktail("D")];
    const day1 = new Date(2026, 0, 1); // bucket 0 (day-of-year 1)
    const day3 = new Date(2026, 0, 3); // bucket 0 (day-of-year 3)
    expect(weeklyChallengePick(cocktails, day1)?.id).toBe(weeklyChallengePick(cocktails, day3)?.id);
  });

  it("changes between two dates a full week apart", () => {
    const cocktails = Array.from({ length: 50 }, (_, i) => cocktail(`C${i}`));
    const week1 = new Date(2026, 0, 5);
    const week2 = new Date(2026, 2, 5); // ~9 weeks later
    expect(weeklyChallengePick(cocktails, week1)?.id).not.toBe(weeklyChallengePick(cocktails, week2)?.id);
  });
});

describe("isChallengeCompletedThisWeek", () => {
  it("is true when an entry for the challenge cocktail falls in the current week", () => {
    const now = new Date(2026, 0, 3);
    const entries = [entry("Mojito", new Date(2026, 0, 1).toISOString())];
    expect(isChallengeCompletedThisWeek(entries, "Mojito", now)).toBe(true);
  });

  it("is false when the entry is for a different cocktail", () => {
    const now = new Date(2026, 8, 16);
    const entries = [entry("Daiquiri", new Date(2026, 8, 15).toISOString())];
    expect(isChallengeCompletedThisWeek(entries, "Mojito", now)).toBe(false);
  });

  it("is false when the entry falls in a different week", () => {
    const now = new Date(2026, 8, 16);
    const entries = [entry("Mojito", new Date(2026, 0, 1).toISOString())];
    expect(isChallengeCompletedThisWeek(entries, "Mojito", now)).toBe(false);
  });
});

describe("hasCompletedAnyWeeklyChallenge", () => {
  it("is false with no history", () => {
    expect(hasCompletedAnyWeeklyChallenge([], [cocktail("A")])).toBe(false);
  });

  it("is true when a past entry matches that week's deterministic pick", () => {
    const cocktails = [cocktail("A"), cocktail("B"), cocktail("C")];
    const someDate = new Date(2026, 3, 10);
    const pick = weeklyChallengePick(cocktails, someDate)!;
    const entries = [entry(pick.id, someDate.toISOString())];
    expect(hasCompletedAnyWeeklyChallenge(entries, cocktails)).toBe(true);
  });

  it("is false when history never matches the week's pick", () => {
    const cocktails = [cocktail("A"), cocktail("B"), cocktail("C")];
    const someDate = new Date(2026, 3, 10);
    const pick = weeklyChallengePick(cocktails, someDate)!;
    const otherId = cocktails.find((c) => c.id !== pick.id)!.id;
    const entries = [entry(otherId, someDate.toISOString())];
    expect(hasCompletedAnyWeeklyChallenge(entries, cocktails)).toBe(false);
  });
});
