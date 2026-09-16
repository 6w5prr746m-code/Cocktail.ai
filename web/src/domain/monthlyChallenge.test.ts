import { describe, expect, it } from "vitest";
import {
  hasCompletedAnyMonthlyChallenge,
  isMonthlyChallengeCompletedThisMonth,
  monthlyChallengePick,
  monthlyThemePick,
  MONTHLY_THEMES,
} from "./monthlyChallenge";
import type { Cocktail } from "./types";
import type { HistoryEntry } from "../state/history";

function cocktail(id: string, overrides: Partial<Cocktail> = {}): Cocktail {
  return {
    id,
    name: id,
    category: "Classique",
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
    ...overrides,
  };
}

function entry(cocktailId: string, completedAt: string): HistoryEntry {
  return { id: `${cocktailId}-${completedAt}`, cocktailId, completedAt };
}

describe("monthlyThemePick", () => {
  it("is stable across two dates in the same month", () => {
    expect(monthlyThemePick(new Date(2026, 3, 1)).id).toBe(monthlyThemePick(new Date(2026, 3, 28)).id);
  });
});

describe("monthlyChallengePick", () => {
  it("returns undefined when no cocktail matches the picked theme", () => {
    const cocktails = [cocktail("A", { category: "Test-only-category" })];
    expect(monthlyChallengePick(cocktails, new Date(2026, 3, 1))).toBeUndefined();
  });

  it("only ever picks a cocktail matching the tirage's theme", () => {
    const tropical = cocktail("trop", { category: "Tropical" });
    const sansAlcool = cocktail("mocktail", { category: "Sans alcool" });
    const cocktails = [tropical, sansAlcool];
    for (let month = 0; month < 24; month++) {
      const now = new Date(2026, month, 1);
      const result = monthlyChallengePick(cocktails, now);
      if (result) expect(result.theme.matches(result.cocktail)).toBe(true);
    }
  });
});

describe("isMonthlyChallengeCompletedThisMonth", () => {
  it("is true for an entry in the same month, false for a different month", () => {
    const now = new Date(2026, 3, 15);
    expect(isMonthlyChallengeCompletedThisMonth([entry("mojito", new Date(2026, 3, 2).toISOString())], "mojito", now)).toBe(true);
    expect(isMonthlyChallengeCompletedThisMonth([entry("mojito", new Date(2026, 2, 2).toISOString())], "mojito", now)).toBe(false);
  });
});

describe("hasCompletedAnyMonthlyChallenge", () => {
  it("is true when a past entry matches that month's deterministic pick", () => {
    // Un cocktail par thème pour que monthlyChallengePick ne retombe jamais sur un bassin vide, quel que soit le mois tiré.
    const cocktails = [
      cocktail("tiki", { category: "Tropical" }),
      cocktail("mocktail", { category: "Sans alcool" }),
      cocktail("corse", { ingredients: [{ ingredientId: "whisky", quantity: 8, unit: "cl", isOptional: false, role: "primarySpirit" }] }),
      cocktail("fruite", { ingredients: [{ ingredientId: "ananas_frais", quantity: 3, unit: "cl", isOptional: false, role: "modifier" }] }),
    ];
    const someDate = new Date(2026, 5, 10);
    const pick = monthlyChallengePick(cocktails, someDate)!;
    expect(hasCompletedAnyMonthlyChallenge([entry(pick.cocktail.id, someDate.toISOString())], cocktails)).toBe(true);
  });

  it("is false with no history", () => {
    expect(hasCompletedAnyMonthlyChallenge([], [cocktail("A", { category: "Tropical" })])).toBe(false);
  });
});

describe("MONTHLY_THEMES", () => {
  it("has at least a few distinct themes with unique ids", () => {
    expect(MONTHLY_THEMES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(MONTHLY_THEMES.map((t) => t.id)).size).toBe(MONTHLY_THEMES.length);
  });
});
