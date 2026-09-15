import { describe, expect, it } from "vitest";
import { decodeSharedRecipe, encodeRecipeForSharing } from "./recipeShareCode";
import type { Cocktail, Ingredient } from "./types";

const ingredientRepo: Ingredient[] = [
  { id: "rhum_blanc", name: "Rhum blanc", category: "Alcool", colorHex: null },
  { id: "sirop_maison", name: "Sirop maison", category: "Autre", colorHex: null },
];

function cocktail(overrides: Partial<Cocktail> = {}): Cocktail {
  return {
    id: "ma_creation",
    name: "Ma Création",
    category: "Classique",
    origin: "Ta création",
    history: null,
    difficulty: 2,
    mainSpirit: "Rhum",
    preparationTimeMinutes: 5,
    glassware: "Verre à cocktail",
    iceType: "Glaçons",
    garnish: "Zeste",
    tips: "Bien mélanger",
    imageURL: "",
    ingredients: [
      { ingredientId: "rhum_blanc", quantity: 5, unit: "cl", isOptional: false, role: "primarySpirit" },
      { ingredientId: "sirop_maison", quantity: 1, unit: "cl", isOptional: false, role: "modifier" },
    ],
    steps: [{ order: 1, instruction: "Mélanger tous les ingrédients", durationSeconds: null }],
    variantIds: [],
    isUserCreated: true,
    ...overrides,
  };
}

describe("encodeRecipeForSharing / decodeSharedRecipe", () => {
  it("round-trips a recipe, resolving ingredient names from the repo", () => {
    const code = encodeRecipeForSharing(cocktail(), ingredientRepo);
    const decoded = decodeSharedRecipe(code);

    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe("Ma Création");
    expect(decoded?.ingredients).toEqual([
      { id: "rhum_blanc", name: "Rhum blanc", category: "Alcool", quantity: 5, unit: "cl", isOptional: false, role: "primarySpirit" },
      { id: "sirop_maison", name: "Sirop maison", category: "Autre", quantity: 1, unit: "cl", isOptional: false, role: "modifier" },
    ]);
    expect(decoded?.steps).toEqual([{ order: 1, instruction: "Mélanger tous les ingrédients", durationSeconds: null }]);
  });

  it("falls back to the raw ingredient id when it isn't found in the repo", () => {
    const code = encodeRecipeForSharing(cocktail(), []);
    const decoded = decodeSharedRecipe(code);
    expect(decoded?.ingredients[0].name).toBe("rhum_blanc");
    expect(decoded?.ingredients[0].category).toBe("Autre");
  });

  it("preserves accented characters", () => {
    const code = encodeRecipeForSharing(cocktail({ name: "Créme de Pêche à l'Étuvée" }), ingredientRepo);
    expect(decodeSharedRecipe(code)?.name).toBe("Créme de Pêche à l'Étuvée");
  });

  it("returns null for garbage input", () => {
    expect(decodeSharedRecipe("not-valid-base64!!!")).toBeNull();
    expect(decodeSharedRecipe("")).toBeNull();
  });

  it("returns null for well-formed base64 that decodes to the wrong shape", () => {
    const code = btoa(JSON.stringify({ foo: "bar" })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(decodeSharedRecipe(code)).toBeNull();
  });

  it("returns null for a recipe with no ingredients or no steps", () => {
    expect(decodeSharedRecipe(encodeRecipeForSharing(cocktail({ ingredients: [] }), ingredientRepo))).toBeNull();
    expect(decodeSharedRecipe(encodeRecipeForSharing(cocktail({ steps: [] }), ingredientRepo))).toBeNull();
  });
});
