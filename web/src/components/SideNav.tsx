import { NavLink } from "react-router-dom";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useAlmostReadyMatches } from "../hooks/useAlmostReadyMatches";
import { BrandMark } from "./BrandMark";
import { NAV_TABS } from "./navTabs";
import { NavBadgeDot } from "./NavBadgeDot";

export const SIDE_NAV_WIDTH = 232;

// Barre latérale desktop (≥ lg) — remplace la TabBar du bas, cachée en
// dessous de ce seuil. Même 5 destinations, présentation verticale.
//
// Variante "Apple-like" : fond en verre dépoli (backdrop-filter, vibrancy
// façon macOS), tuiles d'icônes colorées façon Réglages iOS/macOS plutôt
// qu'un fond doré plein sur l'item actif — voir navTabs.ts pour les teintes.
export function SideNav() {
  const { t } = useTranslation();
  const almostReadyCount = useAlmostReadyMatches().length;
  return (
    <nav
      aria-label={t("tabBar.desktopNavLabel")}
      className="app-chrome hidden lg:flex flex-col flex-shrink-0 gap-1 p-4 border-r sticky top-0 self-start"
      style={{
        width: SIDE_NAV_WIDTH,
        height: "100svh",
        background: "color-mix(in srgb, var(--color-surface) 72%, transparent)",
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        borderColor: "var(--color-border)",
      }}
    >
      <BrandMark className="px-2.5 pt-4 pb-7" />
      {NAV_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `nav-link flex items-center gap-3 rounded-[14px] px-2.5 py-2 text-[15px] font-medium ${isActive ? "is-active" : ""}`}
          style={{ color: "var(--color-text-primary)" }}
        >
          <span
            className="nav-link-tile relative flex items-center justify-center flex-shrink-0"
            style={{ width: 30, height: 30, borderRadius: 8, background: tab.tint, fontSize: 15 }}
            aria-hidden
          >
            {tab.icon}
            {tab.to === "/mybar" && almostReadyCount > 0 && <NavBadgeDot />}
          </span>
          {t(tab.key)}
        </NavLink>
      ))}
    </nav>
  );
}
