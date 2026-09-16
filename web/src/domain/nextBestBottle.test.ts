import { describe, expect, it } from "vitest";
import { computeNextBestBottle } from "./nextBestBottle";
import type { AdvancedMatchResult, Cocktail, Ingredient } from "./types";

function ingredient(id: string): Ingredient {
  return { id, name: id, category: "Alcool", colorHex: null };
}

function cocktail(id: string): Cocktail {
  return {
    id,
    name: id,
    category: "Classique",
    origin: "International",
    history: null,
    difficulty: 1,
    mainSpirit: "Gin",
    preparationTimeMinutes: 3,
    glassware: "Verre",
    iceType: "Glaçons",
    garnish: "",
    tips: null,
    imageURL: "",
    ingredients: [],
    steps: [],
    variantIds: [],
    isUserCreated: false,
  };
}

function match(cocktailId: string, missingIngredientId: string): AdvancedMatchResult {
  return {
    cocktail: cocktail(cocktailId),
    availability: "missingFew",
    compatibilityScore: 0.8,
    proximityScore: 0.8,
    missingIngredients: [ingredient(missingIngredientId)],
    explanation: { satisfiedWeight: 0, totalWeight: 1, missingIngredients: [], degradedIngredients: [], bonusOptionalIngredientsPresent: [] },
  };
}

describe("computeNextBestBottle", () => {
  it("ranks the ingredient that unlocks the most cocktails first", () => {
    const matches = [match("a", "gin"), match("b", "gin"), match("c", "gin"), match("d", "vermouth"), match("e", "vermouth")];
    const result = computeNextBestBottle(matches);
    expect(result[0].ingredient.id).toBe("gin");
    expect(result[0].unlockableCocktailNames).toEqual(["a", "b", "c"]);
    expect(result[1].ingredient.id).toBe("vermouth");
  });

  it("excludes an ingredient that unlocks only one cocktail (already covered by 'Presque prêt')", () => {
    const matches = [match("a", "gin"), match("b", "vermouth"), match("c", "vermouth")];
    const result = computeNextBestBottle(matches);
    expect(result.map((r) => r.ingredient.id)).toEqual(["vermouth"]);
  });

  it("respects the limit", () => {
    const matches = [match("a", "gin"), match("b", "gin"), match("c", "vermouth"), match("d", "vermouth"), match("e", "rhum"), match("f", "rhum")];
    expect(computeNextBestBottle(matches, 2)).toHaveLength(2);
  });

  it("returns an empty list for no matches", () => {
    expect(computeNextBestBottle([])).toEqual([]);
  });
});
