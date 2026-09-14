import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  completed: boolean;
  complete: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist((set) => ({ completed: false, complete: () => set({ completed: true }) }), { name: "cocktailai:onboarding" }),
);
