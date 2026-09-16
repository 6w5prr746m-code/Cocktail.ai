import { describe, expect, it } from "vitest";
import { isSignatureRecipe, preparedCount, SIGNATURE_RECIPE_THRESHOLD } from "./signatureRecipe";
import type { Cocktail } from "./types";
import type { HistoryEntry } from "../state/history";

function cocktail(id: string, isUserCreated: boolean): Cocktail {
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
    isUserCreated,
  };
}

function entries(cocktailId: string, count: number): HistoryEntry[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${cocktailId}-${i}`, cocktailId, completedAt: new Date(2026, 0, i + 1).toISOString() }));
}

describe("isSignatureRecipe", () => {
  it("is false below the threshold, true at and above it", () => {
    const recipe = cocktail("my-recipe", true);
    expect(isSignatureRecipe(recipe, entries("my-recipe", SIGNATURE_RECIPE_THRESHOLD - 1))).toBe(false);
    expect(isSignatureRecipe(recipe, entries("my-recipe", SIGNATURE_RECIPE_THRESHOLD))).toBe(true);
    expect(isSignatureRecipe(recipe, entries("my-recipe", SIGNATURE_RECIPE_THRESHOLD + 5))).toBe(true);
  });

  it("is never true for a catalog cocktail, however many times it was prepared", () => {
    const catalogCocktail = cocktail("mojito", false);
    expect(isSignatureRecipe(catalogCocktail, entries("mojito", 20))).toBe(false);
  });

  it("only counts entries for that specific cocktail id", () => {
    const recipe = cocktail("my-recipe", true);
    const mixed = [...entries("my-recipe", 1), ...entries("other-recipe", 5)];
    expect(isSignatureRecipe(recipe, mixed)).toBe(false);
  });
});

describe("preparedCount", () => {
  it("counts only matching entries", () => {
    const mixed = [...entries("a", 2), ...entries("b", 3)];
    expect(preparedCount("a", mixed)).toBe(2);
    expect(preparedCount("b", mixed)).toBe(3);
    expect(preparedCount("c", mixed)).toBe(0);
  });
});
