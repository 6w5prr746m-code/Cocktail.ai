import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CosmeticsState {
  skinId: string;
  setSkin: (id: string) => void;
}

export const useCosmeticsStore = create<CosmeticsState>()(
  persist((set) => ({ skinId: "or", setSkin: (id) => set({ skinId: id }) }), { name: "cocktailai:cosmetics" }),
);

export function applySkinToDocument(skinId: string) {
  const root = document.documentElement;
  if (skinId === "or") root.removeAttribute("data-skin");
  else root.setAttribute("data-skin", skinId);
}
