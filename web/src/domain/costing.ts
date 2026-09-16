import type { Cocktail } from "./types";

export interface IngredientCost {
  /** Prix d'achat du contenant (bouteille, brique...), dans la devise de l'utilisateur. */
  bottlePrice: number;
  /** Contenance du contenant, en cl. */
  bottleSizeCl: number;
}

export interface CocktailCostBreakdown {
  /** Somme des ingrédients costés (unité de recette volumique, non ambiguë, avec un prix renseigné). */
  costedTotal: number;
  /** Ingrédients non pris en compte : unité non volumique, ambiguë (mesure, shot…), ou prix non renseigné. */
  uncostedIngredientIds: string[];
}

// Facteurs de conversion vers cl pour les unités volumiques du catalogue
// dont la contenance réelle est fixe et non ambiguë (oz = once fluide US
// standard, cc/cs = cuillère à café/soupe standard). Sur les 444 cocktails,
// ces 5 unités couvrent la majorité des lignes d'ingrédient (oz étant même
// plus fréquent que cl). "mesure"/"shot"/"trait" restent volontairement
// non costés : ce sont des unités relatives ou dont la contenance varie
// trop selon la recette pour donner un chiffre honnête plutôt qu'une
// fausse précision.
const CL_PER_UNIT: Record<string, number> = {
  cl: 1,
  ml: 0.1,
  oz: 2.95735 / 10,
  cc: 0.5,
  cs: 1.5,
};

export function isVolumetricUnit(unit: string): boolean {
  return unit in CL_PER_UNIT;
}

/** Convertit une quantité dans son unité de recette vers son équivalent en cl, ou `null` si l'unité n'est pas volumique (voir isVolumetricUnit). */
export function toClEquivalent(quantity: number, unit: string): number | null {
  const clPerUnit = CL_PER_UNIT[unit];
  return clPerUnit ? quantity * clPerUnit : null;
}

export function computeCocktailCost(cocktail: Cocktail, prices: Record<string, IngredientCost>): CocktailCostBreakdown {
  let costedTotal = 0;
  const uncostedIngredientIds: string[] = [];
  for (const link of cocktail.ingredients) {
    const quantityCl = toClEquivalent(link.quantity, link.unit);
    const price = prices[link.ingredientId];
    if (quantityCl !== null && price && price.bottleSizeCl > 0) {
      costedTotal += (quantityCl / price.bottleSizeCl) * price.bottlePrice;
    } else {
      uncostedIngredientIds.push(link.ingredientId);
    }
  }
  return { costedTotal, uncostedIngredientIds };
}

/** Prix de vente suggéré pour atteindre un ratio coût/prix cible (ex: 0.2 = coût matière à 20% du prix de vente). */
export function suggestedSellPrice(cost: number, targetCostRatio: number): number {
  if (targetCostRatio <= 0) return 0;
  return cost / targetCostRatio;
}
