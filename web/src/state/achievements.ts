import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AchievementId } from "../domain/achievements";

interface AchievementsSeenState {
  seenIds: AchievementId[];
  markSeen: (ids: AchievementId[]) => void;
}

export const useAchievementsSeenStore = create<AchievementsSeenState>()(
  persist(
    (set) => ({
      seenIds: [],
      markSeen: (ids) => set((state) => ({ seenIds: [...new Set([...state.seenIds, ...ids])] })),
    }),
    { name: "cocktailai:achievements-seen" },
  ),
);
