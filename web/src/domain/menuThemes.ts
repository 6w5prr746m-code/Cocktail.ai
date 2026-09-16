import type { TranslationKey } from "./i18n/useTranslation";

export type MenuTheme = "classic" | "instagram" | "apple";

export const MENU_THEME_IDS: MenuTheme[] = ["classic", "instagram", "apple"];

export interface MenuThemeStyle {
  labelKey: TranslationKey;
  /** Fond des pages de couverture (CSS background). */
  coverBackground: string;
  accentColor: string;
  /** Couleur de texte lisible sur `coverBackground`. */
  onCoverText: string;
  fontFamily: string;
}

// Trois habillages purement visuels (couleurs + typo), appliqués aux pages
// de couverture/histoire/dos d'une carte — pas de logique métier. "instagram"
// reprend le dégradé de marque bien connu, "apple" mise sur le noir/blanc
// minimal, "classic" reste cohérent avec le reste de l'app (or/anthracite).
export const MENU_THEMES: Record<MenuTheme, MenuThemeStyle> = {
  classic: {
    labelKey: "menuBuilder.themeClassic",
    coverBackground: "linear-gradient(160deg, #c9a227 0%, #2a1f08 55%, #0b0b0f 100%)",
    accentColor: "#c9a227",
    onCoverText: "#f5f1e8",
    fontFamily: "var(--font-display)",
  },
  instagram: {
    labelKey: "menuBuilder.themeInstagram",
    coverBackground: "linear-gradient(135deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)",
    accentColor: "#d62976",
    onCoverText: "#ffffff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  apple: {
    labelKey: "menuBuilder.themeApple",
    coverBackground: "#0b0b0b",
    accentColor: "#ffffff",
    onCoverText: "#f5f5f7",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};
