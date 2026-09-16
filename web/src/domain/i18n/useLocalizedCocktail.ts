import { useMemo } from "react";
import type { Cocktail, Ingredient } from "../types";
import { useLocaleStore } from "../../state/locale";
import { getLocalizedCocktail, getLocalizedIngredientName } from "./localizedCocktail";

export function useLocalizedCocktail(cocktail: Cocktail): Cocktail;
export function useLocalizedCocktail(cocktail: Cocktail | undefined): Cocktail | undefined;
export function useLocalizedCocktail(cocktail: Cocktail | undefined): Cocktail | undefined {
  const locale = useLocaleStore((s) => s.locale) ?? "fr";
  return useMemo(() => (cocktail ? getLocalizedCocktail(cocktail, locale) : undefined), [cocktail, locale]);
}

export function useLocalizedIngredientName(ingredient: Ingredient): string {
  const locale = useLocaleStore((s) => s.locale) ?? "fr";
  return useMemo(() => getLocalizedIngredientName(ingredient.id, ingredient.name, locale), [ingredient, locale]);
}

export function useLocalizedIngredients(ingredients: Ingredient[]): Ingredient[] {
  const locale = useLocaleStore((s) => s.locale) ?? "fr";
  return useMemo(
    () => ingredients.map((i) => ({ ...i, name: getLocalizedIngredientName(i.id, i.name, locale) })),
    [ingredients, locale],
  );
}
