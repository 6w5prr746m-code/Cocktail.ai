import type { Cocktail } from "./types";

export interface PartyIngredientLine {
  ingredientId: string;
  totalQuantity: number;
  unit: string;
  usedBy: string[];
}

/**
 * Additionne les ingrédients de plusieurs cocktails, quantité × nombre
 * d'invités (chaque recette du catalogue est prévue pour 1 verre). Les
 * lignes ne sont regroupées que par (ingrédient, unité) : des unités
 * différentes pour un même ingrédient (ex: "cl" vs "trait") restent
 * volontairement des lignes séparées plutôt que d'être converties.
 */
export function computePartyIngredients(cocktails: Cocktail[], guestCount: number): PartyIngredientLine[] {
  const byKey = new Map<string, PartyIngredientLine>();
  for (const cocktail of cocktails) {
    for (const link of cocktail.ingredients) {
      const key = `${link.ingredientId}__${link.unit}`;
      const line = byKey.get(key) ?? { ingredientId: link.ingredientId, totalQuantity: 0, unit: link.unit, usedBy: [] };
      line.totalQuantity += link.quantity * guestCount;
      if (!line.usedBy.includes(cocktail.name)) line.usedBy.push(cocktail.name);
      byKey.set(key, line);
    }
  }
  return [...byKey.values()].sort((a, b) => b.totalQuantity - a.totalQuantity);
}
