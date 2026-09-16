import { describe, expect, it } from "vitest";
import { foodPairingKey } from "./foodPairing";
import type { Cocktail } from "./types";

function cocktail(overrides: Partial<Cocktail> = {}): Cocktail {
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
    ingredients: [],
    steps: [],
    variantIds: [],
    isUserCreated: false,
    ...overrides,
  };
}

describe("foodPairingKey", () => {
  it("returns the alcohol-free pairing for a mocktail", () => {
    expect(foodPairingKey(cocktail({ category: "Sans alcool" }))).toBe("foodPairing.sansAlcool");
  });

  it("returns the fizzy pairing when the recipe includes a sparkling ingredient", () => {
    expect(
      foodPairingKey(
        cocktail({ ingredients: [{ ingredientId: "champagne", quantity: 10, unit: "cl", isOptional: false, role: "mixer" }] }),
      ),
    ).toBe("foodPairing.petillant");
  });

  it("falls back to a default pairing when no tag matches", () => {
    expect(foodPairingKey(cocktail())).toBe("foodPairing.default");
  });
});
