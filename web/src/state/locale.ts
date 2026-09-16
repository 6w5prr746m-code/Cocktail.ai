import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "fr" | "en";

interface LocaleState {
  /** null tant que l'utilisateur n'a pas encore choisi — déclenche le sélecteur de langue au premier lancement. */
  locale: Locale | null;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: null,
      setLocale: (locale) => set({ locale }),
    }),
    { name: "cocktailai:locale" },
  ),
);
