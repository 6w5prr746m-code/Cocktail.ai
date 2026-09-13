// Portage fidèle de Services/MatchingEngine.swift.
// V1 : présence/absence simple, score = ingrédients possédés / requis, seuil
// d'exclusion à 2 ingrédients manquants.
// V2 : score pondéré par rôle (alcool principal > secondaire > structurant >
// mixer > garniture), satisfaction dégradée par le stock ou une substitution
// utilisable dans l'inventaire.

import { SEED_INGREDIENTS } from "./seed";
import {
  INGREDIENT_ROLE_WEIGHT,
  type AdvancedMatchResult,
  type Cocktail,
  type DegradationReason,
  type DegradedIngredientDetail,
  type Ingredient,
  type MatchExplanation,
  type MatchResult,
  type MissingIngredientDetail,
  type StockStatus,
  type SubstitutionOption,
} from "./types";

const MAX_MISSING_INGREDIENTS = 2;

const ingredientById = new Map<string, Ingredient>(SEED_INGREDIENTS.map((i) => [i.id, i]));

function resolveIngredient(id: string, cocktail: Cocktail): Ingredient {
  return (
    ingredientById.get(id) ?? {
      id,
      name: cocktail.ingredients.find((l) => l.ingredientId === id)?.ingredientId ?? id,
      category: "Autre",
      colorHex: null,
    }
  );
}

// -------------------------------------------------------------- V1 -------

export function computeMatches(availableIngredientIds: Set<string>, cocktails: Cocktail[]): MatchResult[] {
  return cocktails
    .map((cocktail) => match(cocktail, availableIngredientIds))
    .filter((r): r is MatchResult => r !== null)
    .sort((a, b) => {
      if (a.compatibilityScore !== b.compatibilityScore) return b.compatibilityScore - a.compatibilityScore;
      return a.missingIngredients.length - b.missingIngredients.length;
    });
}

function match(cocktail: Cocktail, availableIngredientIds: Set<string>): MatchResult | null {
  const requiredLinks = cocktail.ingredients.filter((l) => !l.isOptional);
  if (requiredLinks.length === 0) return null;

  const requiredIds = new Set(requiredLinks.map((l) => l.ingredientId));
  const missingIds = new Set([...requiredIds].filter((id) => !availableIngredientIds.has(id)));

  if (missingIds.size > MAX_MISSING_INGREDIENTS) return null;

  const possessedCount = requiredIds.size - missingIds.size;
  const score = possessedCount / requiredIds.size;

  const missingIngredients = requiredLinks
    .filter((l) => missingIds.has(l.ingredientId))
    .map((l) => resolveIngredient(l.ingredientId, cocktail));

  return {
    cocktail,
    compatibilityScore: score,
    missingIngredients,
    isFullyAvailable: missingIds.size === 0,
  };
}

// -------------------------------------------------------------- V2 -------

interface Satisfaction {
  fraction: number;
  reason: DegradationReason | null;
}

function satisfactionFor(
  ingredientId: string,
  inventory: Map<string, StockStatus>,
  substitutionsBySource: Map<string, SubstitutionOption[]>,
): Satisfaction {
  const status = inventory.get(ingredientId);
  if (status) {
    if (status === "available") return { fraction: 1.0, reason: null };
    if (status === "low") return { fraction: 0.75, reason: { kind: "lowStock" } };
    return { fraction: 0.4, reason: { kind: "almostEmptyStock" } };
  }

  const candidates = substitutionsBySource.get(ingredientId);
  if (candidates && candidates.length > 0) {
    const usable = candidates.filter((c) => inventory.has(c.substituteIngredientId));
    if (usable.length > 0) {
      const best = usable.reduce((a, b) => (a.degradationFactor > b.degradationFactor ? a : b));
      return { fraction: best.degradationFactor, reason: { kind: "substitution", option: best } };
    }
  }

  return { fraction: 0.0, reason: null };
}

export function computeAdvancedMatches(
  inventory: Map<string, StockStatus>,
  cocktails: Cocktail[],
  substitutions: SubstitutionOption[],
): AdvancedMatchResult[] {
  const substitutionsBySource = new Map<string, SubstitutionOption[]>();
  for (const sub of substitutions) {
    const list = substitutionsBySource.get(sub.sourceIngredientId) ?? [];
    list.push(sub);
    substitutionsBySource.set(sub.sourceIngredientId, list);
  }

  return cocktails
    .map((cocktail) => matchAdvanced(cocktail, inventory, substitutionsBySource))
    .filter((r): r is AdvancedMatchResult => r !== null)
    .sort((a, b) => {
      if (a.compatibilityScore !== b.compatibilityScore) return b.compatibilityScore - a.compatibilityScore;
      return b.proximityScore - a.proximityScore;
    });
}

function matchAdvanced(
  cocktail: Cocktail,
  inventory: Map<string, StockStatus>,
  substitutionsBySource: Map<string, SubstitutionOption[]>,
): AdvancedMatchResult | null {
  const requiredLinks = cocktail.ingredients.filter((l) => !l.isOptional);
  if (requiredLinks.length === 0) return null;

  const evaluations = requiredLinks.map((link) => ({
    link,
    result: satisfactionFor(link.ingredientId, inventory, substitutionsBySource),
  }));

  const zeroSatisfactionCount = evaluations.filter((e) => e.result.fraction === 0).length;
  if (zeroSatisfactionCount > MAX_MISSING_INGREDIENTS) return null;

  const totalWeight = requiredLinks.reduce((sum, l) => sum + INGREDIENT_ROLE_WEIGHT[l.role], 0);
  const satisfiedWeight = evaluations.reduce(
    (sum, e) => sum + e.result.fraction * INGREDIENT_ROLE_WEIGHT[e.link.role],
    0,
  );
  const compatibilityScore = totalWeight > 0 ? satisfiedWeight / totalWeight : 0;

  const satisfiedCount = requiredLinks.length - zeroSatisfactionCount;
  const proximityScore = satisfiedCount / requiredLinks.length;

  const isFullyAvailable = evaluations.every((e) => e.result.fraction === 1.0);

  const missingIngredients = evaluations
    .filter((e) => e.result.fraction === 0)
    .map((e) => resolveIngredient(e.link.ingredientId, cocktail));

  const explanation = buildExplanation(cocktail, evaluations, totalWeight, satisfiedWeight, inventory);

  return {
    cocktail,
    availability: isFullyAvailable ? "ready" : "missingFew",
    compatibilityScore,
    proximityScore,
    missingIngredients,
    explanation,
  };
}

function buildExplanation(
  cocktail: Cocktail,
  evaluations: { link: Cocktail["ingredients"][number]; result: Satisfaction }[],
  totalWeight: number,
  satisfiedWeight: number,
  inventory: Map<string, StockStatus>,
): MatchExplanation {
  const missing: MissingIngredientDetail[] = evaluations
    .filter((e) => e.result.fraction === 0)
    .map((e) => ({ ingredient: resolveIngredient(e.link.ingredientId, cocktail), role: e.link.role }));

  const degraded: DegradedIngredientDetail[] = evaluations
    .filter((e) => e.result.fraction > 0 && e.result.fraction < 1.0 && e.result.reason)
    .map((e) => ({
      ingredient: resolveIngredient(e.link.ingredientId, cocktail),
      role: e.link.role,
      reason: e.result.reason as DegradationReason,
      satisfactionFraction: e.result.fraction,
    }));

  const optionalLinks = cocktail.ingredients.filter((l) => l.isOptional);
  const bonusOptionalIngredientsPresent = optionalLinks
    .filter((l) => inventory.has(l.ingredientId))
    .map((l) => resolveIngredient(l.ingredientId, cocktail));

  return { satisfiedWeight, totalWeight, missingIngredients: missing, degradedIngredients: degraded, bonusOptionalIngredientsPresent };
}
