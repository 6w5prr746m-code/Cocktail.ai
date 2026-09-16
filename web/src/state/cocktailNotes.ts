import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CocktailNotesState {
  notes: Record<string, string>;
  setNote: (cocktailId: string, text: string) => void;
}

// Notes personnelles, privées à l'appareil (comme tout le reste de l'app —
// voir README § Différences assumées, pas de compte ni de synchronisation).
export const useCocktailNotesStore = create<CocktailNotesState>()(
  persist(
    (set) => ({
      notes: {},
      setNote: (cocktailId, text) =>
        set((state) => {
          const trimmed = text.trim();
          const next = { ...state.notes };
          if (trimmed.length > 0) next[cocktailId] = trimmed;
          else delete next[cocktailId];
          return { notes: next };
        }),
    }),
    { name: "cocktailai:cocktail-notes" },
  ),
);
