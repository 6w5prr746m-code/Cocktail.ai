import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_INGREDIENTS } from "../domain/seed";
import type { Ingredient } from "../domain/types";

interface CustomIngredientsState {
  byId: Record<string, Ingredient>;
  findOrCreate: (name: string, category?: string) => Ingredient;
}

// Réplique Features/RecipeForm/RecipeFormViewModel.swift::findOrCreateIngredient :
// recherche insensible à la casse dans le référentiel existant, sinon
// création à la volée. Limite connue et assumée (voir README iOS) : deux
// noms distincts produisant le même slug (accents) entreraient en conflit.
export function useCustomIngredientsStore() {
  return useStore();
}

const useStore = create<CustomIngredientsState>()(
  persist(
    (set, get) => ({
      byId: {},
      findOrCreate: (name, category = "Autre") => {
        const trimmed = name.trim();
        const seedMatch = SEED_INGREDIENTS.find((i) => i.name.toLowerCase() === trimmed.toLowerCase());
        if (seedMatch) return seedMatch;
        const existing = Object.values(get().byId).find((i) => i.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) return existing;
        const id = trimmed
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
        const ingredient: Ingredient = { id: id || crypto.randomUUID(), name: trimmed, category, colorHex: null };
        set((state) => ({ byId: { ...state.byId, [ingredient.id]: ingredient } }));
        return ingredient;
      },
    }),
    { name: "cocktailai:custom-ingredients" },
  ),
);

export function getCustomIngredientsSnapshot(): Record<string, Ingredient> {
  return useStore.getState().byId;
}
