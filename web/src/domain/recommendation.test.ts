import { describe, expect, it } from "vitest";
import { pickSurprise, recommendCocktails } from "./recommendation";
import type { Cocktail, CocktailIngredientLink } from "./types";

function link(ingredientId: string): CocktailIngredientLink {
  return { ingredientId, quantity: 1, unit: "cl", isOptional: false, role: "modifier" };
}

function cocktail(
  id: string,
  { mainSpirit = "Rhum", difficulty = 1 as 1 | 2 | 3, ingredients = [] as CocktailIngredientLink[] } = {},
): Cocktail {
  return {
    id,
    name: id,
    category: "Test",
    origin: "Test",
    history: null,
    difficulty,
    mainSpirit,
    preparationTimeMinutes: 3,
    glassware: "Verre",
    iceType: "Glaçons",
    garnish: "Aucune",
    tips: null,
    imageURL: "",
    ingredients,
    steps: [],
    variantIds: [],
    isUserCreated: false,
  };
}

describe("recommendCocktails", () => {
  it("falls back to difficulty-ascending, alphabetical order with no signal (cold start)", () => {
    const cocktails = [
      cocktail("Zombie", { difficulty: 3 }),
      cocktail("Daiquiri", { difficulty: 1 }),
      cocktail("Mojito", { difficulty: 1 }),
    ];
    const result = recommendCocktails(cocktails, { favoriteIds: [], historyCocktailIds: [] });
    expect(result.map((c) => c.id)).toEqual(["Daiquiri", "Mojito", "Zombie"]);
  });

  it("excludes already-favorited and already-prepared cocktails from the results", () => {
    const cocktails = [cocktail("Mojito"), cocktail("Daiquiri"), cocktail("Old Cuban")];
    const result = recommendCocktails(cocktails, { favoriteIds: ["Mojito"], historyCocktailIds: ["Daiquiri"] });
    expect(result.map((c) => c.id)).toEqual(["Old Cuban"]);
  });

  it("ranks candidates sharing a favorited main spirit above unrelated ones", () => {
    const cocktails = [
      cocktail("Mojito", { mainSpirit: "Rhum" }),
      cocktail("Daiquiri", { mainSpirit: "Rhum" }),
      cocktail("Margarita", { mainSpirit: "Tequila" }),
    ];
    const result = recommendCocktails(cocktails, { favoriteIds: ["Mojito"], historyCocktailIds: [] });
    expect(result.map((c) => c.id)).toEqual(["Daiquiri", "Margarita"]);
  });

  it("ranks candidates sharing a taste tag above ones that don't", () => {
    const liked = cocktail("Mojito", { ingredients: [link("menthe_fraiche"), link("citron_vert")] });
    const freshCandidate = cocktail("Virgin Mojito", {
      mainSpirit: "Sans alcool",
      ingredients: [link("menthe_fraiche")],
    });
    const unrelatedCandidate = cocktail("Old Fashioned", { mainSpirit: "Whisky", ingredients: [] });
    const result = recommendCocktails([liked, freshCandidate, unrelatedCandidate], {
      favoriteIds: ["Mojito"],
      historyCocktailIds: [],
    });
    expect(result[0].id).toBe("Virgin Mojito");
  });

  it("respects the limit parameter", () => {
    const cocktails = [cocktail("A"), cocktail("B"), cocktail("C")];
    const result = recommendCocktails(cocktails, { favoriteIds: [], historyCocktailIds: [] }, 2);
    expect(result).toHaveLength(2);
  });
});

describe("pickSurprise", () => {
  it("returns undefined for an empty catalog", () => {
    expect(pickSurprise([])).toBeUndefined();
  });

  it("avoids excluded cocktails when an alternative exists", () => {
    const cocktails = [cocktail("Mojito"), cocktail("Daiquiri")];
    for (let i = 0; i < 20; i++) {
      const pick = pickSurprise(cocktails, new Set(["Mojito"]));
      expect(pick?.id).toBe("Daiquiri");
    }
  });

  it("falls back to the full pool when everything is excluded", () => {
    const cocktails = [cocktail("Mojito"), cocktail("Daiquiri")];
    const pick = pickSurprise(cocktails, new Set(["Mojito", "Daiquiri"]));
    expect(["Mojito", "Daiquiri"]).toContain(pick?.id);
  });
});
