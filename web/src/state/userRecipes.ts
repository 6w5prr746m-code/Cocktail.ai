import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cocktail } from "../domain/types";

interface UserRecipesState {
  recipes: Cocktail[];
  upsert: (recipe: Cocktail) => void;
  remove: (id: string) => void;
}

export const useUserRecipesStore = create<UserRecipesState>()(
  persist(
    (set) => ({
      recipes: [],
      upsert: (recipe) =>
        set((state) => {
          const idx = state.recipes.findIndex((r) => r.id === recipe.id);
          if (idx === -1) return { recipes: [...state.recipes, recipe] };
          const next = state.recipes.slice();
          next[idx] = recipe;
          return { recipes: next };
        }),
      remove: (id) => set((state) => ({ recipes: state.recipes.filter((r) => r.id !== id) })),
    }),
    { name: "cocktailai:user-recipes" },
  ),
);
