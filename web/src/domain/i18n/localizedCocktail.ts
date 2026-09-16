import type { Cocktail } from "../types";
import type { Locale } from "../../state/locale";
import cocktailFieldNamesEn from "../../data/cocktailFieldNames.en.json";
import ingredientNamesEn from "../../data/ingredientNames.en.json";
import cocktailLocaleOverrides from "../../data/cocktailLocaleOverrides.json";
import { SEED_INGREDIENTS } from "../seed";

interface CocktailOverlay {
  history?: string | null;
  tips?: string | null;
  steps?: string[];
}

type OverlayEntry = { fr?: CocktailOverlay; en?: CocktailOverlay };

const OVERRIDES = cocktailLocaleOverrides as Record<string, OverlayEntry>;

const FIELD_EN = cocktailFieldNamesEn as {
  category: Record<string, string>;
  origin: Record<string, string>;
  iceType: Record<string, string>;
  glassware: Record<string, string>;
  garnish: Record<string, string>;
  ingredientCategory: Record<string, string>;
  tasteTag: Record<string, string>;
  unit: Record<string, string>;
};

const INGREDIENT_NAME_EN = ingredientNamesEn as Record<string, string>;

// mainSpirit est un nom d'ingrédient affiché (ou "Aucun") — pas de
// dictionnaire dédié, on réutilise le dictionnaire d'ingrédients (indexé par
// slug) en le faisant correspondre par NOM via le registre d'ingrédients
// (name -> slug -> nom anglais).
const MAIN_SPIRIT_EN: Record<string, string> = { Aucun: "None" };
for (const ingredient of SEED_INGREDIENTS) {
  const en = INGREDIENT_NAME_EN[ingredient.id];
  if (en) MAIN_SPIRIT_EN[ingredient.name] = en;
}

function applyStepOverrides(cocktail: Cocktail, steps: string[] | undefined) {
  if (!steps) return cocktail.steps;
  return cocktail.steps.map((step, i) => ({ ...step, instruction: steps[i] ?? step.instruction }));
}

export function getLocalizedCocktail(cocktail: Cocktail, locale: Locale): Cocktail {
  const overlay = OVERRIDES[cocktail.id]?.[locale];

  if (locale === "fr") {
    if (!overlay?.steps) return cocktail;
    return { ...cocktail, steps: applyStepOverrides(cocktail, overlay.steps) };
  }

  return {
    ...cocktail,
    category: FIELD_EN.category[cocktail.category] ?? cocktail.category,
    origin: FIELD_EN.origin[cocktail.origin] ?? cocktail.origin,
    mainSpirit: MAIN_SPIRIT_EN[cocktail.mainSpirit] ?? cocktail.mainSpirit,
    glassware: FIELD_EN.glassware[cocktail.glassware] ?? cocktail.glassware,
    iceType: FIELD_EN.iceType[cocktail.iceType] ?? cocktail.iceType,
    garnish: FIELD_EN.garnish[cocktail.garnish] ?? cocktail.garnish,
    history: overlay?.history !== undefined ? overlay.history : cocktail.history,
    tips: overlay?.tips !== undefined ? overlay.tips : cocktail.tips,
    steps: applyStepOverrides(cocktail, overlay?.steps),
  };
}

export function getLocalizedIngredientName(ingredientId: string, fallbackName: string, locale: Locale): string {
  if (locale === "fr") return fallbackName;
  return INGREDIENT_NAME_EN[ingredientId] ?? fallbackName;
}

export function getLocalizedCategory(category: string, locale: Locale): string {
  if (locale === "fr") return category;
  return FIELD_EN.category[category] ?? category;
}

export function getLocalizedMainSpirit(mainSpirit: string, locale: Locale): string {
  if (locale === "fr") return mainSpirit;
  return MAIN_SPIRIT_EN[mainSpirit] ?? mainSpirit;
}

export function getLocalizedIngredientCategory(category: string, locale: Locale): string {
  if (locale === "fr") return category;
  return FIELD_EN.ingredientCategory[category] ?? category;
}

export function getLocalizedTasteTags(tags: string[], locale: Locale): string[] {
  if (locale === "fr") return tags;
  return tags.map((tag) => FIELD_EN.tasteTag[tag] ?? tag);
}

export function getLocalizedUnit(unit: string, locale: Locale): string {
  if (locale === "fr") return unit;
  return FIELD_EN.unit[unit] ?? unit;
}
