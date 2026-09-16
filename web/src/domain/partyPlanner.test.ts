import { describe, expect, it } from "vitest";
import { computePartyIngredients } from "./partyPlanner";
import type { Cocktail } from "./types";

function cocktail(id: string, ingredients: Cocktail["ingredients"]): Cocktail {
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
    ingredients,
    steps: [],
    variantIds: [],
    isUserCreated: false,
  };
}

describe("computePartyIngredients", () => {
  it("scales quantities by guest count", () => {
    const gin = cocktail("gin-tonic", [{ ingredientId: "gin", quantity: 5, unit: "cl", isOptional: false, role: "primarySpirit" }]);
    const lines = computePartyIngredients([gin], 4);
    expect(lines).toEqual([{ ingredientId: "gin", totalQuantity: 20, unit: "cl", usedBy: ["gin-tonic"] }]);
  });

  it("sums the same ingredient/unit across multiple cocktails", () => {
    const a = cocktail("a", [{ ingredientId: "citron", quantity: 1, unit: "cl", isOptional: false, role: "modifier" }]);
    const b = cocktail("b", [{ ingredientId: "citron", quantity: 2, unit: "cl", isOptional: false, role: "modifier" }]);
    const lines = computePartyIngredients([a, b], 2);
    expect(lines).toEqual([{ ingredientId: "citron", totalQuantity: 6, unit: "cl", usedBy: ["a", "b"] }]);
  });

  it("keeps different units for the same ingredient as separate lines", () => {
    const a = cocktail("a", [{ ingredientId: "menthe", quantity: 1, unit: "brins", isOptional: false, role: "garnish" }]);
    const b = cocktail("b", [{ ingredientId: "menthe", quantity: 2, unit: "cl", isOptional: false, role: "modifier" }]);
    const lines = computePartyIngredients([a, b], 1);
    expect(lines).toHaveLength(2);
  });

  it("returns an empty list for no cocktails", () => {
    expect(computePartyIngredients([], 4)).toEqual([]);
  });
});
