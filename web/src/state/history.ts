import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryEntry {
  id: string;
  cocktailId: string;
  completedAt: string; // ISO date
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (cocktailId: string) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (cocktailId) =>
        set((state) => ({
          entries: [
            { id: crypto.randomUUID(), cocktailId, completedAt: new Date().toISOString() },
            ...state.entries,
          ],
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: "cocktailai:history" },
  ),
);
