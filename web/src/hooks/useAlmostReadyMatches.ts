import { useMemo } from "react";
import { useAllCocktails } from "../domain/catalog";
import { computeAdvancedMatches } from "../domain/matchingEngine";
import { SEED_SUBSTITUTIONS } from "../domain/seed";
import type { AdvancedMatchResult, StockStatus } from "../domain/types";
import { useMyBarStore } from "../state/myBar";

/**
 * Cocktails à exactement 1 ingrédient requis manquant — le sous-ensemble le
 * plus actionnable de "missingFew" (computeAdvancedMatches), utilisé pour la
 * pastille de nav et la bannière d'accueil : "encore un ingrédient et c'est
 * débloqué" est un signal plus fort qu'un simple pourcentage de compatibilité.
 */
export function useAlmostReadyMatches(): AdvancedMatchResult[] {
  const cocktails = useAllCocktails();
  const entries = useMyBarStore((s) => s.entries);

  const inventory = useMemo(() => {
    const map = new Map<string, StockStatus>();
    for (const entry of Object.values(entries)) map.set(entry.ingredientId, entry.stockStatus);
    return map;
  }, [entries]);

  return useMemo(
    () =>
      computeAdvancedMatches(inventory, cocktails, SEED_SUBSTITUTIONS).filter(
        (m) => m.availability === "missingFew" && m.missingIngredients.length === 1,
      ),
    [inventory, cocktails],
  );
}
