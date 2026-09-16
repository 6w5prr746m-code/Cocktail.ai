import { describe, expect, it } from "vitest";
import { computeCocktailCost, isVolumetricUnit, suggestedSellPrice } from "./costing";
import type { Cocktail } from "./types";

function cocktail(ingredients: Cocktail["ingredients"]): Cocktail {
  return {
    id: "c",
    name: "c",
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
    ingredients,
    steps: [],
    variantIds: [],
    isUserCreated: false,
  };
}

describe("computeCocktailCost", () => {
  it("costs a cl-based ingredient proportionally to the bottle price", () => {
    const c = cocktail([{ ingredientId: "gin", quantity: 5, unit: "cl", isOptional: false, role: "primarySpirit" }]);
    const result = computeCocktailCost(c, { gin: { bottlePrice: 20, bottleSizeCl: 70 } });
    expect(result.costedTotal).toBeCloseTo((5 / 70) * 20, 5);
    expect(result.uncostedIngredientIds).toEqual([]);
  });

  it("leaves a non-cl ingredient uncosted", () => {
    const c = cocktail([{ ingredientId: "citron", quantity: 1, unit: "pièce", isOptional: false, role: "modifier" }]);
    const result = computeCocktailCost(c, { citron: { bottlePrice: 2, bottleSizeCl: 100 } });
    expect(result.costedTotal).toBe(0);
    expect(result.uncostedIngredientIds).toEqual(["citron"]);
  });

  it("leaves a cl-based ingredient uncosted when no price is set", () => {
    const c = cocktail([{ ingredientId: "gin", quantity: 5, unit: "cl", isOptional: false, role: "primarySpirit" }]);
    const result = computeCocktailCost(c, {});
    expect(result.costedTotal).toBe(0);
    expect(result.uncostedIngredientIds).toEqual(["gin"]);
  });

  it("sums multiple costed ingredients", () => {
    const c = cocktail([
      { ingredientId: "gin", quantity: 5, unit: "cl", isOptional: false, role: "primarySpirit" },
      { ingredientId: "vermouth", quantity: 2, unit: "cl", isOptional: false, role: "secondarySpirit" },
    ]);
    const result = computeCocktailCost(c, {
      gin: { bottlePrice: 21, bottleSizeCl: 70 },
      vermouth: { bottlePrice: 14, bottleSizeCl: 100 },
    });
    expect(result.costedTotal).toBeCloseTo((5 / 70) * 21 + (2 / 100) * 14, 5);
  });

  it("costs an oz-based ingredient by converting to its cl equivalent (majority unit in the catalog, e.g. Negroni)", () => {
    const c = cocktail([{ ingredientId: "gin", quantity: 1, unit: "oz", isOptional: false, role: "primarySpirit" }]);
    const result = computeCocktailCost(c, { gin: { bottlePrice: 21, bottleSizeCl: 70 } });
    expect(result.costedTotal).toBeCloseTo((2.95735 / 10 / 70) * 21, 5);
    expect(result.uncostedIngredientIds).toEqual([]);
  });

  it("costs ml and teaspoon/tablespoon ingredients too", () => {
    const c = cocktail([
      { ingredientId: "citron", quantity: 10, unit: "ml", isOptional: false, role: "modifier" },
      { ingredientId: "sirop", quantity: 1, unit: "cc", isOptional: false, role: "modifier" },
    ]);
    const result = computeCocktailCost(c, {
      citron: { bottlePrice: 3, bottleSizeCl: 50 },
      sirop: { bottlePrice: 5, bottleSizeCl: 70 },
    });
    expect(result.costedTotal).toBeCloseTo((1 / 50) * 3 + (0.5 / 70) * 5, 5);
  });
});

describe("isVolumetricUnit", () => {
  it("recognizes the convertible units", () => {
    expect(isVolumetricUnit("cl")).toBe(true);
    expect(isVolumetricUnit("oz")).toBe(true);
    expect(isVolumetricUnit("ml")).toBe(true);
  });

  it("rejects ambiguous or non-volumetric units", () => {
    expect(isVolumetricUnit("mesure")).toBe(false);
    expect(isVolumetricUnit("pièce")).toBe(false);
    expect(isVolumetricUnit("shot")).toBe(false);
  });
});

describe("suggestedSellPrice", () => {
  it("divides the cost by the target cost ratio", () => {
    expect(suggestedSellPrice(2, 0.2)).toBeCloseTo(10, 5);
  });

  it("returns 0 for a non-positive ratio", () => {
    expect(suggestedSellPrice(2, 0)).toBe(0);
  });
});
