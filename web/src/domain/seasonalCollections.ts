import type { Cocktail } from "./types";
import type { TranslationKey } from "./i18n/useTranslation";

export interface Season {
  id: string;
  icon: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  matches: (cocktail: Cocktail) => boolean;
}

const WINTER_SPIRITS = [
  "Whisky",
  "Scotch",
  "Bourbon",
  "Rye whiskey",
  "Whisky irlandais",
  "Crown Royal",
  "Jack Daniel's",
  "Jim Beam",
  "Wild Turkey",
  "Cognac",
  "Brandy",
];

// Deux saisons couvrant l'année, définies sur des champs déjà présents dans
// le catalogue (category, mainSpirit) — pas de méta-donnée éditoriale à
// maintenir. Tailles de bassin vérifiées sur les 444 cocktails : été 15,
// hiver 61 — toutes deux non triviales (même rigueur que monthlyChallenge.ts).
export const SEASONS: Season[] = [
  {
    id: "ete",
    icon: "☀️",
    titleKey: "seasonalCollection.ete.title",
    subtitleKey: "seasonalCollection.ete.subtitle",
    matches: (c) => c.category === "Tropical" || c.category === "Tiki",
  },
  {
    id: "hiver",
    icon: "❄️",
    titleKey: "seasonalCollection.hiver.title",
    subtitleKey: "seasonalCollection.hiver.subtitle",
    matches: (c) => WINTER_SPIRITS.includes(c.mainSpirit),
  },
];

// Hémisphère nord : avril-septembre = été, octobre-mars = hiver.
export function currentSeason(date: Date = new Date()): Season {
  const month = date.getMonth();
  const isSummer = month >= 3 && month <= 8;
  return SEASONS.find((s) => s.id === (isSummer ? "ete" : "hiver"))!;
}

export function seasonalCocktails(season: Season, cocktails: Cocktail[]): Cocktail[] {
  return cocktails.filter(season.matches);
}
