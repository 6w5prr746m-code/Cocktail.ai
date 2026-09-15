import { create } from "zustand";
import { persist } from "zustand/middleware";

const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

interface DismissedNudgesState {
  dismissedUntil: Record<string, string>;
  dismiss: (key: string) => void;
  isDismissed: (key: string, now?: Date) => boolean;
}

export const useDismissedNudgesStore = create<DismissedNudgesState>()(
  persist(
    (set, get) => ({
      dismissedUntil: {},
      dismiss: (key) =>
        set((state) => ({
          dismissedUntil: { ...state.dismissedUntil, [key]: new Date(Date.now() + DISMISS_DURATION_MS).toISOString() },
        })),
      isDismissed: (key, now = new Date()) => {
        const until = get().dismissedUntil[key];
        return until !== undefined && now.getTime() < new Date(until).getTime();
      },
    }),
    { name: "cocktailai:dismissed-nudges" },
  ),
);
