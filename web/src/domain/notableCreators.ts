import raw from "../data/notableCreators.json";
import type { Locale } from "../state/locale";
import { slugify } from "./slug";

interface RawNotableCreator {
  creator: string;
  year: { fr: string; en: string };
  place: { fr: string; en: string };
}

export interface NotableCreator {
  creator: string;
  year: string;
  place: string;
}

const RAW = raw as Record<string, RawNotableCreator>;

// Indexé par id de cocktail (slugify du nom, même clé que SEED_COCKTAILS) —
// voir src/data/notableCreators.json pour la source, un nom par entrée
// comme collections.json.
const BY_ID = new Map<string, RawNotableCreator>(Object.entries(RAW).map(([name, info]) => [slugify(name), info]));

export function getNotableCreator(cocktailId: string, locale: Locale): NotableCreator | undefined {
  const raw = BY_ID.get(cocktailId);
  if (!raw) return undefined;
  return { creator: raw.creator, year: raw.year[locale], place: raw.place[locale] };
}

/** Existence seule, sans résolution de locale — pour compter les préparations sans avoir besoin de la langue courante (ex: contexte des badges). */
export function hasNotableCreator(cocktailId: string): boolean {
  return BY_ID.has(cocktailId);
}
