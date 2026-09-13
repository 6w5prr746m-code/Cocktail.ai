import { useMemo } from "react";
import { useUserRecipesStore } from "../state/userRecipes";
import { useCustomIngredientsStore } from "../state/customIngredients";
import { SEED_COCKTAILS, SEED_COLLECTIONS, SEED_INGREDIENTS } from "./seed";
import type { Cocktail, CollectionDef, Ingredient } from "./types";

export function useAllCocktails(): Cocktail[] {
  const userRecipes = useUserRecipesStore((s) => s.recipes);
  return useMemo(() => [...SEED_COCKTAILS, ...userRecipes], [userRecipes]);
}

export function useCocktail(id: string | undefined): Cocktail | undefined {
  const all = useAllCocktails();
  return useMemo(() => all.find((c) => c.id === id), [all, id]);
}

export function useAllIngredients(): Ingredient[] {
  const custom = useCustomIngredientsStore().byId;
  return useMemo(
    () => [...SEED_INGREDIENTS, ...Object.values(custom)].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [custom],
  );
}

export function useCollections(): CollectionDef[] {
  return SEED_COLLECTIONS;
}

export function useCollection(id: string | undefined): CollectionDef | undefined {
  return SEED_COLLECTIONS.find((c) => c.id === id);
}
