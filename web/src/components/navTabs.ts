import type { TranslationKey } from "../domain/i18n/useTranslation";

// Partagé entre TabBar (mobile/tablette) et SideNav (desktop) — même 5
// destinations, deux présentations.
export const NAV_TABS: { to: string; key: TranslationKey; icon: string; end: boolean }[] = [
  { to: "/", key: "tabBar.home", icon: "🏠", end: true },
  { to: "/library", key: "tabBar.library", icon: "📚", end: false },
  { to: "/mybar", key: "tabBar.myBar", icon: "🥃", end: false },
  { to: "/favorites", key: "tabBar.favorites", icon: "❤️", end: false },
  { to: "/profile", key: "tabBar.profile", icon: "👤", end: false },
];
