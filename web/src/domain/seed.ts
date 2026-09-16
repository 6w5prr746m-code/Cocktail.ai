import cocktailsRaw from "../data/cocktails.json";
import collectionsRaw from "../data/collections.json";
import substitutionsRaw from "../data/substitutions.json";
import { slugify } from "./slug";
import type {
  Cocktail,
  CollectionDef,
  Ingredient,
  IngredientRole,
  SubstitutionOption,
} from "./types";

interface RawIngredientLink {
  slug: string;
  name: string;
  category: string;
  colorHex: string | null;
  quantity: number;
  unit: string;
  isOptional: boolean;
  role: IngredientRole;
}

interface RawStep {
  order: number;
  instruction: string;
  durationSeconds: number | null;
}

interface RawCocktail {
  name: string;
  category: string;
  origin: string;
  history: string | null;
  difficulty: number;
  mainSpirit: string;
  preparationTimeMinutes: number;
  glassware: string;
  iceType: string;
  garnish: string;
  tips: string | null;
  imageURL: string;
  ingredients: RawIngredientLink[];
  steps: RawStep[];
}

interface RawCollection {
  name: string;
  iconName: string;
  cocktailNames: string[];
  description?: string;
}

interface RawSubstitution {
  sourceSlug: string;
  substituteSlug: string;
  degradationFactor: number;
}

const rawCocktails = cocktailsRaw as RawCocktail[];
const rawCollections = collectionsRaw as RawCollection[];
const rawSubstitutions = substitutionsRaw as RawSubstitution[];

const ingredientRegistry = new Map<string, Ingredient>();

for (const cocktail of rawCocktails) {
  for (const link of cocktail.ingredients) {
    if (!ingredientRegistry.has(link.slug)) {
      ingredientRegistry.set(link.slug, {
        id: link.slug,
        name: link.name,
        category: link.category,
        colorHex: link.colorHex,
      });
    }
  }
}

export const SEED_INGREDIENTS: Ingredient[] = Array.from(ingredientRegistry.values()).sort((a, b) =>
  a.name.localeCompare(b.name, "fr"),
);

export const SEED_COCKTAILS: Cocktail[] = rawCocktails.map((raw) => ({
  id: slugify(raw.name),
  name: raw.name,
  category: raw.category,
  origin: raw.origin,
  history: raw.history,
  difficulty: raw.difficulty as 1 | 2 | 3,
  mainSpirit: raw.mainSpirit,
  preparationTimeMinutes: raw.preparationTimeMinutes,
  glassware: raw.glassware,
  iceType: raw.iceType,
  garnish: raw.garnish,
  tips: raw.tips,
  imageURL: raw.imageURL,
  ingredients: raw.ingredients.map((link) => ({
    ingredientId: link.slug,
    quantity: link.quantity,
    unit: link.unit,
    isOptional: link.isOptional,
    role: link.role,
  })),
  steps: raw.steps
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((step) => ({ order: step.order, instruction: step.instruction, durationSeconds: step.durationSeconds })),
  variantIds: [],
  isUserCreated: false,
}));

const cocktailIdByName = new Map(SEED_COCKTAILS.map((c) => [c.name, c.id]));

export const SEED_COLLECTIONS: CollectionDef[] = rawCollections
  .map((raw) => ({
    id: slugify(raw.name),
    name: raw.name,
    iconName: raw.iconName,
    description: raw.description,
    cocktailIds: raw.cocktailNames.map((n) => cocktailIdByName.get(n)).filter((v): v is string => Boolean(v)),
  }))
  .filter((collection) => collection.cocktailIds.length > 0);

export const SEED_SUBSTITUTIONS: SubstitutionOption[] = rawSubstitutions.map((raw) => ({
  sourceIngredientId: raw.sourceSlug,
  substituteIngredientId: raw.substituteSlug,
  degradationFactor: raw.degradationFactor,
}));

export const INGREDIENT_CATEGORIES: string[] = Array.from(new Set(SEED_INGREDIENTS.map((i) => i.category))).sort(
  (a, b) => a.localeCompare(b, "fr"),
);

export const COCKTAIL_CATEGORIES: string[] = Array.from(new Set(SEED_COCKTAILS.map((c) => c.category))).sort((a, b) =>
  a.localeCompare(b, "fr"),
);

export const MAIN_SPIRITS: string[] = Array.from(new Set(SEED_COCKTAILS.map((c) => c.mainSpirit))).sort((a, b) =>
  a.localeCompare(b, "fr"),
);
