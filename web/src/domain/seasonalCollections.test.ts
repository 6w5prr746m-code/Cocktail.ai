import { describe, expect, it } from "vitest";
import { currentSeason, seasonalCocktails, SEASONS } from "./seasonalCollections";
import type { Cocktail } from "./types";

function cocktail(id: string, overrides: Partial<Cocktail> = {}): Cocktail {
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
    ...overrides,
  };
}

describe("currentSeason", () => {
  it("picks été for a month in April-September", () => {
    expect(currentSeason(new Date(2024, 6, 15)).id).toBe("ete");
  });

  it("picks hiver for a month outside April-September", () => {
    expect(currentSeason(new Date(2024, 11, 15)).id).toBe("hiver");
  });
});

describe("seasonalCocktails", () => {
  it("filters été on Tropical/Tiki category", () => {
    const ete = SEASONS.find((s) => s.id === "ete")!;
    const cocktails = [cocktail("a", { category: "Tropical" }), cocktail("b", { category: "Classique" })];
    expect(seasonalCocktails(ete, cocktails).map((c) => c.id)).toEqual(["a"]);
  });

  it("filters hiver on whisky/brandy family mainSpirit", () => {
    const hiver = SEASONS.find((s) => s.id === "hiver")!;
    const cocktails = [cocktail("a", { mainSpirit: "Bourbon" }), cocktail("b", { mainSpirit: "Vodka" })];
    expect(seasonalCocktails(hiver, cocktails).map((c) => c.id)).toEqual(["a"]);
  });
});
