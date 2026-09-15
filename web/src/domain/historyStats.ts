import type { Cocktail } from "./types";
import type { HistoryEntry } from "../state/history";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(aKey: string, bKey: string): number {
  return Math.round((dateFromKey(bKey).getTime() - dateFromKey(aKey).getTime()) / 86_400_000);
}

export interface HistoryStats {
  totalCount: number;
  monthlyCount: number;
  /** Jours consécutifs jusqu'à aujourd'hui (ou hier, si rien n'a encore été préparé aujourd'hui — la série n'est pas encore rompue). 0 si le dernier cocktail préparé remonte à avant-hier ou plus. */
  currentStreakDays: number;
  longestStreakDays: number;
  mostPrepared: { cocktail: Cocktail; count: number } | null;
}

/**
 * Statistiques dérivées de l'historique de préparation — calcule tout sur
 * le fuseau horaire local de l'utilisateur (comme l'historique lui-même,
 * qui n'a de sens que sur cet appareil, voir README § Différences assumées).
 */
export function computeHistoryStats(entries: HistoryEntry[], cocktails: Cocktail[], now: Date = new Date()): HistoryStats {
  const totalCount = entries.length;

  const monthlyCount = entries.filter((e) => {
    const d = new Date(e.completedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const dayKeys = new Set(entries.map((e) => dateKey(new Date(e.completedAt))));
  const sortedDays = [...dayKeys].sort();
  const nowKey = dateKey(now);

  let currentStreakDays = 0;
  const mostRecentDay = sortedDays[sortedDays.length - 1];
  const streakIsAlive = dayKeys.has(nowKey) || (mostRecentDay !== undefined && daysBetween(mostRecentDay, nowKey) === 1);
  if (streakIsAlive) {
    let cursorKey = dayKeys.has(nowKey) ? nowKey : mostRecentDay;
    while (cursorKey !== undefined && dayKeys.has(cursorKey)) {
      currentStreakDays++;
      cursorKey = dateKey(new Date(dateFromKey(cursorKey).getTime() - 86_400_000));
    }
  }

  let longestStreakDays = 0;
  let run = 0;
  let prevKey: string | null = null;
  for (const key of sortedDays) {
    run = prevKey !== null && daysBetween(prevKey, key) === 1 ? run + 1 : 1;
    longestStreakDays = Math.max(longestStreakDays, run);
    prevKey = key;
  }

  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.cocktailId, (counts.get(e.cocktailId) ?? 0) + 1);
  let mostPrepared: HistoryStats["mostPrepared"] = null;
  for (const [cocktailId, count] of counts) {
    if (count > (mostPrepared?.count ?? 0)) {
      const cocktail = cocktails.find((c) => c.id === cocktailId);
      if (cocktail) mostPrepared = { cocktail, count };
    }
  }

  return { totalCount, monthlyCount, currentStreakDays, longestStreakDays, mostPrepared };
}
