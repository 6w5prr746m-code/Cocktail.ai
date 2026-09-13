import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favoriteIds: string[];
  isFavorite: (cocktailId: string) => boolean;
  toggleFavorite: (cocktailId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      isFavorite: (cocktailId) => get().favoriteIds.includes(cocktailId),
      toggleFavorite: (cocktailId) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(cocktailId)
            ? state.favoriteIds.filter((id) => id !== cocktailId)
            : [...state.favoriteIds, cocktailId],
        })),
    }),
    { name: "cocktailai:favorites" },
  ),
);
