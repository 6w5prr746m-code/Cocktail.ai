export type IngredientRole = "primarySpirit" | "secondarySpirit" | "modifier" | "mixer" | "garnish";

export const INGREDIENT_ROLE_WEIGHT: Record<IngredientRole, number> = {
  primarySpirit: 1.0,
  secondarySpirit: 0.8,
  modifier: 0.6,
  mixer: 0.35,
  garnish: 0.15,
};

export const INGREDIENT_ROLE_LABEL: Record<IngredientRole, string> = {
  primarySpirit: "Alcool principal",
  secondarySpirit: "Alcool secondaire",
  modifier: "Ingrédient structurant",
  mixer: "Mixer",
  garnish: "Garniture",
};

export type StockStatus = "available" | "low" | "almostEmpty";

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  available: "Disponible",
  low: "Faible",
  almostEmpty: "Presque terminé",
};

export const STOCK_STATUS_ORDER: Record<StockStatus, number> = {
  available: 0,
  low: 1,
  almostEmpty: 2,
};

export interface Ingredient {
  id: string; // slug
  name: string;
  category: string;
  colorHex: string | null;
}

export interface CocktailIngredientLink {
  ingredientId: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  role: IngredientRole;
}

export interface RecipeStep {
  order: number;
  instruction: string;
  durationSeconds: number | null;
}

export interface Cocktail {
  id: string; // slug
  name: string;
  category: string;
  origin: string;
  history: string | null;
  difficulty: 1 | 2 | 3;
  mainSpirit: string;
  preparationTimeMinutes: number;
  glassware: string;
  iceType: string;
  garnish: string;
  tips: string | null;
  imageURL: string;
  ingredients: CocktailIngredientLink[];
  steps: RecipeStep[];
  variantIds: string[];
  isUserCreated: boolean;
}

export interface CollectionDef {
  id: string;
  name: string;
  iconName: string;
  cocktailIds: string[];
  /** Chapeau éditorial optionnel affiché sous le titre sur la fiche collection (ex: "Cocktails d'exception") — comme le nom, non localisé (voir README § Limites connues). */
  description?: string;
}

export interface SubstitutionOption {
  sourceIngredientId: string;
  substituteIngredientId: string;
  degradationFactor: number;
}

export interface MatchResult {
  cocktail: Cocktail;
  compatibilityScore: number; // 0..1
  missingIngredients: Ingredient[];
  isFullyAvailable: boolean;
}

export type DegradationReason =
  | { kind: "lowStock" }
  | { kind: "almostEmptyStock" }
  | { kind: "substitution"; option: SubstitutionOption };

export interface MissingIngredientDetail {
  ingredient: Ingredient;
  role: IngredientRole;
}

export interface DegradedIngredientDetail {
  ingredient: Ingredient;
  role: IngredientRole;
  reason: DegradationReason;
  satisfactionFraction: number;
}

export interface MatchExplanation {
  satisfiedWeight: number;
  totalWeight: number;
  missingIngredients: MissingIngredientDetail[];
  degradedIngredients: DegradedIngredientDetail[];
  bonusOptionalIngredientsPresent: Ingredient[];
}

export interface AdvancedMatchResult {
  cocktail: Cocktail;
  availability: "ready" | "missingFew";
  compatibilityScore: number; // 0..1
  proximityScore: number; // 0..1
  missingIngredients: Ingredient[];
  explanation: MatchExplanation;
}

export type BarReadiness = "empty" | "almostReady" | "excellent";

export const BAR_READINESS_TEXT: Record<BarReadiness, { title: string; subtitle: string }> = {
  empty: {
    title: "Ton bar est vide",
    subtitle: "Ajoute quelques ingrédients pour découvrir ce que tu peux préparer.",
  },
  almostReady: {
    title: "Ton bar prend forme",
    subtitle: "Encore quelques ingrédients et de nouveaux cocktails s'ouvriront à toi.",
  },
  excellent: {
    title: "Excellent bar !",
    subtitle: "Tu as de quoi préparer un large choix de cocktails dès maintenant.",
  },
};

export const BAR_EXCELLENT_THRESHOLD = 5;

export function evaluateBarReadiness(ingredientCount: number, unlockedCocktailCount: number): BarReadiness {
  if (ingredientCount <= 0) return "empty";
  if (unlockedCocktailCount <= 0) return "almostReady";
  return unlockedCocktailCount >= BAR_EXCELLENT_THRESHOLD ? "excellent" : "almostReady";
}
