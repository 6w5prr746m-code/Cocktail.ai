import type { Cocktail, Ingredient, IngredientRole } from "./types";

// Une recette perso ne vit que dans le localStorage de son créateur — un
// lien `/cocktail/<id>` partagé à quelqu'un d'autre pointerait dans le
// vide sur son appareil. Ce module encode un instantané autoporteur de la
// recette (ingrédients *dénormalisés*, avec leur nom, pas seulement leur
// id — le référentiel d'ingrédients du destinataire ne connaît pas
// forcément les ingrédients perso du créateur) directement dans l'URL,
// sans backend ni base de données.

export interface SharedIngredient {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  role: IngredientRole;
}

export interface SharedRecipePayload {
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
  ingredients: SharedIngredient[];
  steps: { order: number; instruction: string; durationSeconds: number | null }[];
}

const MAX_LIST_LENGTH = 40;
const MAX_STRING_LENGTH = 1000;

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function encodeRecipeForSharing(cocktail: Cocktail, ingredientRepo: Ingredient[]): string {
  const payload: SharedRecipePayload = {
    name: cocktail.name,
    category: cocktail.category,
    origin: cocktail.origin,
    history: cocktail.history,
    difficulty: cocktail.difficulty,
    mainSpirit: cocktail.mainSpirit,
    preparationTimeMinutes: cocktail.preparationTimeMinutes,
    glassware: cocktail.glassware,
    iceType: cocktail.iceType,
    garnish: cocktail.garnish,
    tips: cocktail.tips,
    ingredients: cocktail.ingredients.map((link) => {
      const ingredient = ingredientRepo.find((i) => i.id === link.ingredientId);
      return {
        id: link.ingredientId,
        name: ingredient?.name ?? link.ingredientId,
        category: ingredient?.category ?? "Autre",
        quantity: link.quantity,
        unit: link.unit,
        isOptional: link.isOptional,
        role: link.role,
      };
    }),
    steps: cocktail.steps.map((s) => ({ order: s.order, instruction: s.instruction, durationSeconds: s.durationSeconds })),
  };

  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
}

function isValidPayload(value: unknown): value is SharedRecipePayload {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  if (typeof p.name !== "string" || p.name.length === 0 || p.name.length > MAX_STRING_LENGTH) return false;
  if (!Array.isArray(p.ingredients) || p.ingredients.length === 0 || p.ingredients.length > MAX_LIST_LENGTH) return false;
  if (!Array.isArray(p.steps) || p.steps.length === 0 || p.steps.length > MAX_LIST_LENGTH) return false;
  return p.ingredients.every(
    (i) => i && typeof i === "object" && typeof (i as SharedIngredient).name === "string" && typeof (i as SharedIngredient).id === "string",
  );
}

/** Décode un lien de recette partagée. Retourne `null` pour tout code manquant, corrompu, ou ne respectant pas la forme attendue — jamais d'exception, c'est du contenu potentiellement forgé arrivant par URL. */
export function decodeSharedRecipe(code: string): SharedRecipePayload | null {
  try {
    const json = new TextDecoder().decode(base64UrlDecode(code));
    const parsed: unknown = JSON.parse(json);
    return isValidPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
