import type { Cocktail } from "./types";
import type { HistoryEntry } from "../state/history";

export const SIGNATURE_RECIPE_THRESHOLD = 3;

export function preparedCount(cocktailId: string, entries: HistoryEntry[]): number {
  return entries.filter((e) => e.cocktailId === cocktailId).length;
}

/**
 * Une recette perso devient "signature" une fois préparée plusieurs fois —
 * par son créateur, le seul utilisateur possible ici puisque l'app est
 * 100% locale (voir README § Différences assumées, pas de compte ni de
 * synchronisation). Aucun état à stocker : dérivé de l'historique existant.
 */
export function isSignatureRecipe(cocktail: Cocktail, entries: HistoryEntry[], threshold = SIGNATURE_RECIPE_THRESHOLD): boolean {
  return cocktail.isUserCreated && preparedCount(cocktail.id, entries) >= threshold;
}
