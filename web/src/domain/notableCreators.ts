import raw from "../data/notableCreators.json";
import creatorBiosRaw from "../data/creatorBios.json";
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
  /** Biographie courte du créateur (indépendante du cocktail) — absente si non documentée, voir creatorBios.json. */
  bio: string | null;
}

const RAW = raw as Record<string, RawNotableCreator>;
const CREATOR_BIOS = creatorBiosRaw as Record<string, { fr: string; en: string }>;

// Indexé par id de cocktail (slugify du nom, même clé que SEED_COCKTAILS) —
// voir src/data/notableCreators.json pour la source, un nom par entrée
// comme collections.json. Les biographies (creatorBios.json) sont indexées
// séparément par nom de créateur, pour ne pas dupliquer le texte quand un
// même bartender a plusieurs cocktails dans la collection (ex: Dick
// Bradsell : Bramble et Espresso Martini).
const BY_ID = new Map<string, RawNotableCreator>(Object.entries(RAW).map(([name, info]) => [slugify(name), info]));

export function getNotableCreator(cocktailId: string, locale: Locale): NotableCreator | undefined {
  const raw = BY_ID.get(cocktailId);
  if (!raw) return undefined;
  return { creator: raw.creator, year: raw.year[locale], place: raw.place[locale], bio: CREATOR_BIOS[raw.creator]?.[locale] ?? null };
}

/** Existence seule, sans résolution de locale — pour compter les préparations sans avoir besoin de la langue courante (ex: contexte des badges). */
export function hasNotableCreator(cocktailId: string): boolean {
  return BY_ID.has(cocktailId);
}

/** Ids de tous les cocktails ayant un créateur documenté — pour la section d'accueil et le filtre de la bibliothèque. */
export function notableCocktailIds(): string[] {
  return [...BY_ID.keys()];
}
