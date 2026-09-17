import { Flower2, Leaf, Martini, Cherry, type LucideIcon } from "lucide-react";
import type { Cocktail } from "./types";
import type { HistoryEntry } from "../state/history";
import { tasteProfile } from "./tasteProfile";
import type { TranslationKey } from "./i18n/useTranslation";

// Même principe déterministe que weeklyChallenge.ts (hash de la période),
// mais à l'échelle du mois et en deux temps : on tire d'abord un thème
// (rotation parmi un petit nombre d'ambiances réelles du catalogue), puis un
// cocktail dans le sous-ensemble qui correspond à ce thème.
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function hashKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash;
}

export interface MonthlyTheme {
  id: string;
  /** Icône vectorielle utilisée à l'écran. */
  icon: LucideIcon;
  /** Emoji utilisé uniquement pour la carte de partage dessinée en <canvas> (ShareCardModal) — voir le même commentaire dans achievements.ts. */
  emoji: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  matches: (cocktail: Cocktail) => boolean;
}

// Chaque thème s'appuie sur un champ déjà présent dans le catalogue
// (category, tasteProfile) — pas de méta-donnée éditoriale à maintenir.
// Tailles de bassin vérifiées sur les 444 cocktails : tiki 15, sans alcool
// 42, corsé 6, fruité 33 — toutes non triviales.
export const MONTHLY_THEMES: MonthlyTheme[] = [
  {
    id: "tiki",
    icon: Flower2,
    emoji: "🌺",
    titleKey: "monthlyChallenge.themeTiki.title",
    descKey: "monthlyChallenge.themeTiki.desc",
    matches: (c) => c.category === "Tropical" || c.category === "Tiki",
  },
  {
    id: "sans_alcool",
    icon: Leaf,
    emoji: "🍃",
    titleKey: "monthlyChallenge.themeSansAlcool.title",
    descKey: "monthlyChallenge.themeSansAlcool.desc",
    matches: (c) => c.category === "Sans alcool",
  },
  {
    id: "corse",
    icon: Martini,
    emoji: "🥃",
    titleKey: "monthlyChallenge.themeCorse.title",
    descKey: "monthlyChallenge.themeCorse.desc",
    matches: (c) => tasteProfile(c).includes("Corsé"),
  },
  {
    id: "fruite",
    icon: Cherry,
    emoji: "🍓",
    titleKey: "monthlyChallenge.themeFruite.title",
    descKey: "monthlyChallenge.themeFruite.desc",
    matches: (c) => tasteProfile(c).includes("Fruité"),
  },
];

export function monthlyThemePick(now: Date = new Date()): MonthlyTheme {
  return MONTHLY_THEMES[hashKey(monthKey(now)) % MONTHLY_THEMES.length];
}

export interface MonthlyChallenge {
  theme: MonthlyTheme;
  cocktail: Cocktail;
}

export function monthlyChallengePick(cocktails: Cocktail[], now: Date = new Date()): MonthlyChallenge | undefined {
  const theme = monthlyThemePick(now);
  const pool = cocktails.filter(theme.matches);
  if (pool.length === 0) return undefined;
  const cocktail = pool[hashKey(monthKey(now) + theme.id) % pool.length];
  return { theme, cocktail };
}

export function isMonthlyChallengeCompletedThisMonth(entries: HistoryEntry[], cocktailId: string, now: Date = new Date()): boolean {
  const key = monthKey(now);
  return entries.some((e) => e.cocktailId === cocktailId && monthKey(new Date(e.completedAt)) === key);
}

/** Même approche rétroactive que hasCompletedAnyWeeklyChallenge : on rejoue le tirage pur sur chaque date d'historique, aucun état à stocker pour ce badge. */
export function hasCompletedAnyMonthlyChallenge(entries: HistoryEntry[], cocktails: Cocktail[]): boolean {
  return entries.some((e) => monthlyChallengePick(cocktails, new Date(e.completedAt))?.cocktail.id === e.cocktailId);
}
