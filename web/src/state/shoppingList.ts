import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ShoppingListItem {
  ingredientId: string;
  checked: boolean;
}

interface ShoppingListState {
  items: Record<string, ShoppingListItem>;
  addItem: (ingredientId: string) => void;
  addItems: (ingredientIds: string[]) => void;
  removeItem: (ingredientId: string) => void;
  toggleChecked: (ingredientId: string) => void;
  clearChecked: () => void;
}

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set) => ({
      items: {},
      addItem: (ingredientId) =>
        set((state) => ({
          items: { ...state.items, [ingredientId]: state.items[ingredientId] ?? { ingredientId, checked: false } },
        })),
      addItems: (ingredientIds) =>
        set((state) => {
          const next = { ...state.items };
          for (const id of ingredientIds) next[id] = next[id] ?? { ingredientId: id, checked: false };
          return { items: next };
        }),
      removeItem: (ingredientId) =>
        set((state) => {
          const next = { ...state.items };
          delete next[ingredientId];
          return { items: next };
        }),
      toggleChecked: (ingredientId) =>
        set((state) => {
          const existing = state.items[ingredientId];
          if (!existing) return state;
          return { items: { ...state.items, [ingredientId]: { ...existing, checked: !existing.checked } } };
        }),
      clearChecked: () =>
        set((state) => {
          const next: Record<string, ShoppingListItem> = {};
          for (const item of Object.values(state.items)) if (!item.checked) next[item.ingredientId] = item;
          return { items: next };
        }),
    }),
    { name: "cocktailai:shopping-list" },
  ),
);
