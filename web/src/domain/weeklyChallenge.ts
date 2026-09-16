import type { Cocktail } from "./types";
import type { HistoryEntry } from "../state/history";

// Même principe déterministe que dailyPick (gradient.ts) — jour de l'année
// remplacé par semaine de l'année — mais haché plutôt que pris directement
// comme index, pour éviter que deux semaines consécutives retombent sur des
// cocktails voisins dans le catalogue (dailyPick n'a pas ce problème vu le
// nombre de jours, mais 52 semaines seulement le rendraient visible).
function weekOfYear(date: Date): number {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000);
  return Math.floor(dayOfYear / 7);
}

function weekKey(date: Date): string {
  return `${date.getFullYear()}-${weekOfYear(date)}`;
}

function hashKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash;
}

/** Défi de la semaine — même cocktail pour tout le monde pendant 7 jours, change automatiquement à la semaine suivante. */
export function weeklyChallengePick(cocktails: Cocktail[], now: Date = new Date()): Cocktail | undefined {
  if (cocktails.length === 0) return undefined;
  return cocktails[hashKey(weekKey(now)) % cocktails.length];
}

export function isChallengeCompletedThisWeek(entries: HistoryEntry[], challengeCocktailId: string, now: Date = new Date()): boolean {
  const key = weekKey(now);
  return entries.some((e) => e.cocktailId === challengeCocktailId && weekKey(new Date(e.completedAt)) === key);
}

/**
 * Vérifie rétroactivement si l'utilisateur a un jour préparé le défi de la
 * semaine en cours à ce moment-là — weeklyChallengePick étant pur et
 * déterministe (fonction de la semaine + du catalogue), on peut le
 * recalculer pour chaque entrée d'historique passée sans stocker d'état
 * supplémentaire dédié à ce badge.
 */
export function hasCompletedAnyWeeklyChallenge(entries: HistoryEntry[], cocktails: Cocktail[]): boolean {
  return entries.some((e) => weeklyChallengePick(cocktails, new Date(e.completedAt))?.id === e.cocktailId);
}
