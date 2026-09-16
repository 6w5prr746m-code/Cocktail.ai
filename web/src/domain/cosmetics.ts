import type { TranslationKey } from "./i18n/useTranslation";

export interface Skin {
  id: string;
  labelKey: TranslationKey;
  unlockBadgeCount: number;
  /** Couleur d'aperçu pour le sélecteur (Profil). Doit rester synchronisée
   * avec --color-accent-gold du sélecteur [data-skin=...] dans index.css —
   * l'application effective de la couleur passe par le CSS, pas par ce champ. */
  previewColor: string;
}

// Skins cosmétiques (couleur d'accent) débloqués par nombre de badges —
// mécanique d'engagement à la jeu vidéo, purement locale (pas de compte).
// Les couleurs elles-mêmes vivent en CSS (index.css, sélecteur
// [data-skin=...]), ce module ne porte que la logique de déblocage.
export const SKINS: Skin[] = [
  { id: "or", labelKey: "cosmetics.skinOr", unlockBadgeCount: 0, previewColor: "#c9a227" },
  { id: "emeraude", labelKey: "cosmetics.skinEmeraude", unlockBadgeCount: 3, previewColor: "#1f9d6e" },
  { id: "rubis", labelKey: "cosmetics.skinRubis", unlockBadgeCount: 6, previewColor: "#c92e3f" },
  { id: "amethyste", labelKey: "cosmetics.skinAmethyste", unlockBadgeCount: 10, previewColor: "#7c4dc9" },
];

export function isSkinUnlocked(skin: Skin, unlockedBadgeCount: number): boolean {
  return unlockedBadgeCount >= skin.unlockBadgeCount;
}
