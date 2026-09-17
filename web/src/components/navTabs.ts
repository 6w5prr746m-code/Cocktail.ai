import { Home, Library, Martini, Heart, User, type LucideIcon } from "lucide-react";
import type { TranslationKey } from "../domain/i18n/useTranslation";

// Partagé entre TabBar (mobile/tablette) et SideNav (desktop) — même 5
// destinations, deux présentations. `tint` : couleur de la tuile d'icône
// façon Réglages iOS (menu "Apple-like", voir SideNav/TabBar) — une teinte
// distincte par section pour s'y retrouver d'un coup d'œil dans la liste.
export const NAV_TABS: { to: string; key: TranslationKey; icon: LucideIcon; end: boolean; tint: string }[] = [
  { to: "/", key: "tabBar.home", icon: Home, end: true, tint: "#0A84FF" },
  { to: "/library", key: "tabBar.library", icon: Library, end: false, tint: "#5E5CE6" },
  { to: "/mybar", key: "tabBar.myBar", icon: Martini, end: false, tint: "#FF9F0A" },
  { to: "/favorites", key: "tabBar.favorites", icon: Heart, end: false, tint: "#FF375F" },
  { to: "/profile", key: "tabBar.profile", icon: User, end: false, tint: "#8E8E93" },
];
