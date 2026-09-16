import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IngredientCost } from "../domain/costing";

interface IngredientCostsState {
  prices: Record<string, IngredientCost>;
  setPrice: (ingredientId: string, cost: IngredientCost) => void;
}

export const useIngredientCostsStore = create<IngredientCostsState>()(
  persist(
    (set) => ({
      prices: {},
      setPrice: (ingredientId, cost) => set((state) => ({ prices: { ...state.prices, [ingredientId]: cost } })),
    }),
    { name: "cocktailai:ingredient-costs" },
  ),
);
