import { SEED_COCKTAILS, SEED_INGREDIENTS } from "./seed";
import type { Ingredient } from "./types";

const STARTER_COUNT = 6;

// Ingrédients de départ suggérés à l'onboarding et dans l'état vide de Mon
// Bar : les plus fréquents parmi les ingrédients *obligatoires* du
// catalogue — donnée dérivée du seed plutôt que codée en dur, cohérent
// avec le reste de l'app (voir les heuristiques documentées de Home.tsx).
function computeStarterIngredients(): Ingredient[] {
  const frequency = new Map<string, number>();
  for (const cocktail of SEED_COCKTAILS) {
    for (const link of cocktail.ingredients) {
      if (link.isOptional) continue;
      frequency.set(link.ingredientId, (frequency.get(link.ingredientId) ?? 0) + 1);
    }
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, STARTER_COUNT)
    .map(([id]) => SEED_INGREDIENTS.find((i) => i.id === id))
    .filter((i): i is Ingredient => Boolean(i));
}

export const STARTER_INGREDIENTS: Ingredient[] = computeStarterIngredients();
