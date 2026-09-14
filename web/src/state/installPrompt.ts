import { create } from "zustand";

// L'événement `beforeinstallprompt` (Chrome/Edge/Android) peut se déclencher
// avant même que l'utilisateur n'arrive sur l'écran Profil — on l'écoute
// dès le montage de l'app (voir main.tsx) et on le garde en mémoire jusqu'à
// ce qu'un composant veuille déclencher l'installation.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptState {
  deferredEvent: BeforeInstallPromptEvent | null;
  installed: boolean;
  setDeferredEvent: (e: BeforeInstallPromptEvent) => void;
  markInstalled: () => void;
}

export const useInstallPromptStore = create<InstallPromptState>((set) => ({
  deferredEvent: null,
  installed: false,
  setDeferredEvent: (e) => set({ deferredEvent: e }),
  markInstalled: () => set({ deferredEvent: null, installed: true }),
}));

export function registerInstallPromptListeners() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    useInstallPromptStore.getState().setDeferredEvent(e as BeforeInstallPromptEvent);
  });
  window.addEventListener("appinstalled", () => {
    useInstallPromptStore.getState().markInstalled();
  });
}

export function isRunningStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
