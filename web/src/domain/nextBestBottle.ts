import type { AdvancedMatchResult, Ingredient } from "./types";

export interface NextBestBottle {
  ingredient: Ingredient;
  unlockableCocktailNames: string[];
}

/**
 * Parmi les cocktails à exactement 1 ingrédient manquant, quel ingrédient
 * revient le plus souvent ? L'acheter débloque plusieurs cocktails d'un
 * coup — un signal d'achat plus actionnable qu'une liste de courses plate.
 * `oneMissingMatches` doit déjà être filtré sur missingIngredients.length === 1.
 * `minUnlocks` (défaut 2) exclut les ingrédients qui ne débloquent qu'un
 * seul cocktail : ce cas est déjà couvert par la section "Presque prêt",
 * l'afficher aussi ici ne ferait que dupliquer le même nom à l'écran.
 */
export function computeNextBestBottle(oneMissingMatches: AdvancedMatchResult[], limit = 3, minUnlocks = 2): NextBestBottle[] {
  const byIngredient = new Map<string, { ingredient: Ingredient; names: string[] }>();
  for (const match of oneMissingMatches) {
    const missing = match.missingIngredients[0];
    if (!missing) continue;
    const entry = byIngredient.get(missing.id) ?? { ingredient: missing, names: [] };
    entry.names.push(match.cocktail.name);
    byIngredient.set(missing.id, entry);
  }
  return [...byIngredient.values()]
    .filter((e) => e.names.length >= minUnlocks)
    .sort((a, b) => b.names.length - a.names.length)
    .slice(0, limit)
    .map((e) => ({ ingredient: e.ingredient, unlockableCocktailNames: e.names }));
}
