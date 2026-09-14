// Portage fidèle de Tests/MatchingEngineTests.swift (V1, 7 cas) et
// Tests/MatchingEngineV2Tests.swift (V2, cas applicables au port TS — la
// notion de "variante" n'existe pas côté web, voir note plus bas).
//
// Différence de conception assumée par rapport aux tests Swift : les
// assertions portent sur `.id` plutôt que sur `.name` pour les ingrédients.
// Le modèle TS ne stocke pas de nom par lien (contrairement à
// `IngredientEntity` côté Swift) — le nom est résolu via un référentiel
// global (`SEED_INGREDIENTS`) au moment de l'affichage, pas au moment du
// calcul. Tester sur `.id` isole le moteur de matching de ce référentiel et
// évite un couplage accidentel aux données du seed réel.
import { describe, expect, it } from "vitest";
import { computeAdvancedMatches, computeMatches } from "./matchingEngine";
import type { Cocktail, CocktailIngredientLink, IngredientRole, StockStatus, SubstitutionOption } from "./types";

function link(
  ingredientId: string,
  role: IngredientRole = "modifier",
  isOptional = false,
): CocktailIngredientLink {
  return { ingredientId, quantity: 1, unit: "cl", isOptional, role };
}

function cocktail(name: string, links: CocktailIngredientLink[]): Cocktail {
  return {
    id: name.toLowerCase().replace(/\s+/g, "_"),
    name,
    category: "Test",
    origin: "Test",
    history: null,
    difficulty: 1,
    mainSpirit: "Test",
    preparationTimeMinutes: 3,
    glassware: "Verre",
    iceType: "Glaçons",
    garnish: "Aucune",
    tips: null,
    imageURL: "",
    ingredients: links,
    steps: [],
    variantIds: [],
    isUserCreated: false,
  };
}

// ---------------------------------------------------------------- V1 -----

describe("computeMatches (V1)", () => {
  it("scores a fully available cocktail at 100%", () => {
    const c = cocktail("Daiquiri", [link("rhum"), link("citron")]);
    const results = computeMatches(new Set(["rhum", "citron"]), [c]);

    expect(results).toHaveLength(1);
    expect(results[0].compatibilityScore).toBe(1.0);
    expect(results[0].isFullyAvailable).toBe(true);
    expect(results[0].missingIngredients).toHaveLength(0);
  });

  it("includes a cocktail with one missing ingredient at the correct score", () => {
    const c = cocktail("Old Cuban", [link("rhum"), link("citron"), link("angostura")]);
    const results = computeMatches(new Set(["rhum", "citron"]), [c]);

    expect(results).toHaveLength(1);
    expect(results[0].missingIngredients.map((i) => i.id)).toEqual(["angostura"]);
    expect(results[0].isFullyAvailable).toBe(false);
    expect(results[0].compatibilityScore).toBeCloseTo(2 / 3, 4);
  });

  it("excludes a cocktail with three or more missing ingredients", () => {
    const c = cocktail("Mojito", [link("rhum"), link("citron"), link("sucre"), link("menthe")]);
    const results = computeMatches(new Set(["rhum"]), [c]);

    expect(results).toHaveLength(0);
  });

  it("excludes a cocktail when no ingredients are available and it needs more than two", () => {
    // Avec seulement 2 ingrédients requis, "aucun disponible" resterait
    // sous le seuil de 2 manquants tolérés (voir le test d'exclusion
    // ci-dessus) — il en faut 3+ pour que ce cas exclue réellement.
    const c = cocktail("Cuba Libre", [link("rhum"), link("coca"), link("citron")]);
    const results = computeMatches(new Set(), [c]);

    expect(results).toHaveLength(0);
  });

  it("never lets an optional ingredient affect score or missing list", () => {
    const c = cocktail("Daiquiri", [link("rhum"), link("citron"), link("menthe_deco", "modifier", true)]);
    const results = computeMatches(new Set(["rhum", "citron"]), [c]);

    expect(results).toHaveLength(1);
    expect(results[0].compatibilityScore).toBe(1.0);
    expect(results[0].missingIngredients).toHaveLength(0);
  });

  it("sorts by score descending, then by fewer missing ingredients", () => {
    const highScore = cocktail("Score eleve", [link("rhum"), link("citron")]);
    const lowScore = cocktail("Score faible", [link("rhum"), link("citron"), link("sucre")]);
    const results = computeMatches(new Set(["rhum", "citron"]), [lowScore, highScore]);

    expect(results[0].cocktail.name).toBe("Score eleve");
  });

  it("excludes a cocktail with no required ingredients (invalid data guard)", () => {
    const c = cocktail("Invalide", []);
    const results = computeMatches(new Set(), [c]);

    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------- V2 -----

function inv(entries: [string, StockStatus][]): Map<string, StockStatus> {
  return new Map(entries);
}

describe("computeAdvancedMatches (V2)", () => {
  it("causes a large score drop when the primary spirit is missing", () => {
    const c = cocktail("Test1", [link("rhum", "primarySpirit"), link("citron", "modifier")]);
    const results = computeAdvancedMatches(inv([["citron", "available"]]), [c], []);

    expect(results).toHaveLength(1);
    // (0*1.0 + 1*0.6) / (1.0 + 0.6) = 0.375
    expect(results[0].compatibilityScore).toBeCloseTo(0.375, 4);
    expect(results[0].missingIngredients.map((i) => i.id)).toEqual(["rhum"]);
    expect(results[0].availability).toBe("missingFew");
  });

  it("has only a small score impact when a garnish is missing", () => {
    const c = cocktail("Test2", [link("rhum", "primarySpirit"), link("menthe", "garnish")]);
    const results = computeAdvancedMatches(inv([["rhum", "available"]]), [c], []);

    // (1*1.0 + 0*0.15) / (1.0 + 0.15) ≈ 0.8696
    expect(results[0].compatibilityScore).toBeCloseTo(1.0 / 1.15, 4);
    expect(results[0].compatibilityScore).toBeGreaterThan(0.85);
  });

  it("never lets an absent optional ingredient affect the score", () => {
    const c = cocktail("Test3", [link("rhum", "primarySpirit"), link("citron", "modifier", true)]);
    const results = computeAdvancedMatches(inv([["rhum", "available"]]), [c], []);

    expect(results[0].compatibilityScore).toBe(1.0);
    expect(results[0].availability).toBe("ready");
  });

  it("shows a present optional ingredient as a bonus, not a score boost", () => {
    const c = cocktail("Test4", [link("rhum", "primarySpirit"), link("citron", "modifier", true)]);
    const results = computeAdvancedMatches(
      inv([
        ["rhum", "available"],
        ["citron", "available"],
      ]),
      [c],
      [],
    );

    expect(results[0].compatibilityScore).toBe(1.0);
    expect(results[0].explanation.bonusOptionalIngredientsPresent.map((i) => i.id)).toEqual(["citron"]);
  });

  it("applies a substitution when the direct ingredient is missing", () => {
    const c = cocktail("Test5", [link("sirop_sucre", "modifier")]);
    const substitution: SubstitutionOption = {
      sourceIngredientId: "sirop_sucre",
      substituteIngredientId: "sucre_canne",
      degradationFactor: 0.85,
    };
    const results = computeAdvancedMatches(inv([["sucre_canne", "available"]]), [c], [substitution]);

    expect(results[0].compatibilityScore).toBeCloseTo(0.85, 4);
    expect(results[0].missingIngredients).toHaveLength(0);
    expect(results[0].explanation.degradedIngredients).toHaveLength(1);
    const reason = results[0].explanation.degradedIngredients[0].reason;
    expect(reason.kind).toBe("substitution");
    if (reason.kind === "substitution") {
      expect(reason.option.substituteIngredientId).toBe("sucre_canne");
    }
  });

  it("chooses the best substitution among multiple candidates", () => {
    const c = cocktail("Test6", [link("source", "modifier")]);
    const substitutions: SubstitutionOption[] = [
      { sourceIngredientId: "source", substituteIngredientId: "faible", degradationFactor: 0.3 },
      { sourceIngredientId: "source", substituteIngredientId: "fort", degradationFactor: 0.9 },
    ];
    const results = computeAdvancedMatches(
      inv([
        ["faible", "available"],
        ["fort", "available"],
      ]),
      [c],
      substitutions,
    );

    expect(results[0].compatibilityScore).toBeCloseTo(0.9, 4);
  });

  it("degrades the score for low stock without treating it as missing", () => {
    const c = cocktail("Test7", [link("rhum", "primarySpirit")]);
    const results = computeAdvancedMatches(inv([["rhum", "low"]]), [c], []);

    expect(results[0].compatibilityScore).toBeCloseTo(0.75, 4);
    expect(results[0].missingIngredients).toHaveLength(0);
    expect(results[0].explanation.degradedIngredients[0].reason.kind).toBe("lowStock");
  });

  it("degrades the score more for almost-empty stock than for low stock", () => {
    const c = cocktail("Test8", [link("rhum", "primarySpirit")]);
    const results = computeAdvancedMatches(inv([["rhum", "almostEmpty"]]), [c], []);

    expect(results[0].compatibilityScore).toBeCloseTo(0.4, 4);
    expect(results[0].explanation.degradedIngredients[0].reason.kind).toBe("almostEmptyStock");
  });

  it("never lets degraded ingredients count toward the exclusion threshold", () => {
    // 3 ingrédients requis, tous en stock faible (satisfaction > 0 mais < 1) :
    // aucun n'est "manquant" au sens strict, donc pas d'exclusion malgré le
    // seuil de 2 manquants max.
    const c = cocktail("Test9", [link("a"), link("b"), link("c")]);
    const results = computeAdvancedMatches(
      inv([
        ["a", "low"],
        ["b", "low"],
        ["c", "low"],
      ]),
      [c],
      [],
    );

    expect(results).toHaveLength(1);
  });

  it("scores a mocktail without special-casing the absence of a primary spirit", () => {
    const c = cocktail("Mocktail", [link("jus"), link("sirop")]);

    const full = computeAdvancedMatches(
      inv([
        ["jus", "available"],
        ["sirop", "available"],
      ]),
      [c],
      [],
    );
    expect(full[0].compatibilityScore).toBe(1.0);

    const partial = computeAdvancedMatches(inv([["jus", "available"]]), [c], []);
    expect(partial[0].compatibilityScore).toBeCloseTo(0.5, 4);
  });

  it("weighs each spirit independently in a multi-spirit cocktail", () => {
    const c = cocktail("MaiTai", [link("rhum_ambre", "primarySpirit"), link("rhum_agricole", "secondarySpirit")]);
    const results = computeAdvancedMatches(inv([["rhum_ambre", "available"]]), [c], []);

    // 1.0 / (1.0 + 0.8) ≈ 0.5556
    expect(results[0].compatibilityScore).toBeCloseTo(1.0 / 1.8, 4);
    expect(results[0].missingIngredients.map((i) => i.id)).toEqual(["rhum_agricole"]);
  });

  it("excludes a cocktail when more than two ingredients are fully missing", () => {
    const c = cocktail("Test10", [link("a"), link("b"), link("c"), link("d")]);
    const results = computeAdvancedMatches(inv([["a", "available"]]), [c], []);

    expect(results).toHaveLength(0);
  });

  it("sorts results by compatibility score descending", () => {
    const high = cocktail("Haut", [link("rhum", "primarySpirit")]);
    const low = cocktail("Bas", [link("rhum", "primarySpirit"), link("citron", "modifier")]);
    const results = computeAdvancedMatches(inv([["rhum", "available"]]), [low, high], []);

    expect(results[0].cocktail.name).toBe("Haut");
  });

  it("is deterministic across repeated calls with the same input", () => {
    const c = cocktail("Determ", [link("rhum", "primarySpirit")]);
    const inventory = inv([["rhum", "low"]]);

    const first = computeAdvancedMatches(inventory, [c], []);
    const second = computeAdvancedMatches(inventory, [c], []);

    expect(first[0].compatibilityScore).toBe(second[0].compatibilityScore);
  });

  it("V1 (computeMatches) ignores ingredient role entirely, unlike V2", () => {
    // Rôles très différents (poids 1.0 vs 0.15) — si V1 les respectait par
    // erreur, le score ne serait pas le score uniforme attendu.
    const c = cocktail("V1Check", [link("rhum", "primarySpirit"), link("menthe", "garnish")]);
    const results = computeMatches(new Set(["rhum"]), [c]);

    // V1 : possédés / requis = 1/2 = 0.5, pas le ≈0.87 pondéré de V2.
    expect(results[0].compatibilityScore).toBeCloseTo(0.5, 4);
  });
});
