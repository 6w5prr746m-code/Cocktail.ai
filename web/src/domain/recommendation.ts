import type { Cocktail } from "./types";
import { tasteProfile } from "./tasteProfile";

const SPIRIT_WEIGHT = 2;
const TASTE_TAG_WEIGHT = 1;
const DIFFICULTY_TIEBREAK_WEIGHT = 0.05;

export interface RecommendationSignal {
  favoriteIds: string[];
  historyCocktailIds: string[];
}

/**
 * "Recommandés pour toi" — pondère les cocktails non déjà favoris/préparés
 * par affinité avec l'alcool principal et le profil de goût (`tasteProfile`)
 * des cocktails que l'utilisateur a déjà favorisés ou préparés. Sans aucun
 * signal (nouvel utilisateur), retombe sur le tri par difficulté croissante
 * utilisé avant ce sprint — même comportement pour un compte tout neuf.
 */
export function recommendCocktails(cocktails: Cocktail[], signal: RecommendationSignal, limit = 20): Cocktail[] {
  const likedIds = new Set([...signal.favoriteIds, ...signal.historyCocktailIds]);
  const liked = cocktails.filter((c) => likedIds.has(c.id));
  const candidates = cocktails.filter((c) => !likedIds.has(c.id));

  if (liked.length === 0) {
    return [...candidates].sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name, "fr")).slice(0, limit);
  }

  const spiritCounts = new Map<string, number>();
  const tasteCounts = new Map<string, number>();
  for (const c of liked) {
    spiritCounts.set(c.mainSpirit, (spiritCounts.get(c.mainSpirit) ?? 0) + 1);
    for (const tag of tasteProfile(c)) tasteCounts.set(tag, (tasteCounts.get(tag) ?? 0) + 1);
  }

  return candidates
    .map((cocktail) => {
      let score = (spiritCounts.get(cocktail.mainSpirit) ?? 0) * SPIRIT_WEIGHT;
      for (const tag of tasteProfile(cocktail)) score += (tasteCounts.get(tag) ?? 0) * TASTE_TAG_WEIGHT;
      score -= cocktail.difficulty * DIFFICULTY_TIEBREAK_WEIGHT;
      return { cocktail, score };
    })
    .sort((a, b) => b.score - a.score || a.cocktail.name.localeCompare(b.cocktail.name, "fr"))
    .slice(0, limit)
    .map((s) => s.cocktail);
}

/** Cocktail au hasard pour le bouton "Surprends-moi" — évite si possible ceux déjà favoris/préparés, pour une vraie découverte. */
export function pickSurprise(cocktails: Cocktail[], excludeIds: Set<string> = new Set()): Cocktail | undefined {
  const pool = cocktails.filter((c) => !excludeIds.has(c.id));
  const source = pool.length > 0 ? pool : cocktails;
  if (source.length === 0) return undefined;
  return source[Math.floor(Math.random() * source.length)];
}
