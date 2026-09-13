import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StockStatus } from "../domain/types";

export interface MyBarEntry {
  ingredientId: string;
  stockStatus: StockStatus;
  approximateQuantity: string | null;
}

interface MyBarState {
  entries: Record<string, MyBarEntry>;
  addIngredient: (ingredientId: string) => void;
  removeIngredient: (ingredientId: string) => void;
  setStockStatus: (ingredientId: string, status: StockStatus) => void;
  setApproximateQuantity: (ingredientId: string, value: string) => void;
  ownedIds: () => string[];
}

export const useMyBarStore = create<MyBarState>()(
  persist(
    (set, get) => ({
      entries: {},
      addIngredient: (ingredientId) =>
        set((state) => {
          if (state.entries[ingredientId]) return state;
          return {
            entries: {
              ...state.entries,
              [ingredientId]: { ingredientId, stockStatus: "available", approximateQuantity: null },
            },
          };
        }),
      removeIngredient: (ingredientId) =>
        set((state) => {
          const next = { ...state.entries };
          delete next[ingredientId];
          return { entries: next };
        }),
      setStockStatus: (ingredientId, status) =>
        set((state) => {
          const existing = state.entries[ingredientId];
          if (!existing) return state;
          return { entries: { ...state.entries, [ingredientId]: { ...existing, stockStatus: status } } };
        }),
      setApproximateQuantity: (ingredientId, value) =>
        set((state) => {
          const existing = state.entries[ingredientId];
          if (!existing) return state;
          return {
            entries: {
              ...state.entries,
              [ingredientId]: { ...existing, approximateQuantity: value.trim().length > 0 ? value : null },
            },
          };
        }),
      ownedIds: () => Object.keys(get().entries),
    }),
    { name: "cocktailai:mybar" },
  ),
);
