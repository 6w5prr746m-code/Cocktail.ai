import { NavLink } from "react-router-dom";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useAlmostReadyMatches } from "../hooks/useAlmostReadyMatches";
import { BrandMark } from "./BrandMark";
import { NAV_TABS } from "./navTabs";
import { NavBadgeDot } from "./NavBadgeDot";

export const SIDE_NAV_WIDTH = 232;

// Barre latérale desktop (≥ lg) — remplace la TabBar du bas, cachée en
// dessous de ce seuil. Même 5 destinations, présentation verticale.
export function SideNav() {
  const { t } = useTranslation();
  const almostReadyCount = useAlmostReadyMatches().length;
  return (
    <nav
      aria-label={t("tabBar.desktopNavLabel")}
      className="hidden lg:flex flex-col flex-shrink-0 gap-1 p-4 border-r sticky top-0 self-start"
      style={{ width: SIDE_NAV_WIDTH, height: "100svh", background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <BrandMark className="px-3 pt-4 pb-6" />
      {NAV_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? "is-active" : ""}`}
          style={({ isActive }) => ({
            background: isActive ? "linear-gradient(135deg, var(--color-accent-gold-soft), var(--color-accent-gold))" : "transparent",
            color: isActive ? "#0b0b0f" : "var(--color-text-primary)",
          })}
        >
          <span className="nav-link-icon relative" style={{ fontSize: 18 }} aria-hidden>
            {tab.icon}
            {tab.to === "/mybar" && almostReadyCount > 0 && <NavBadgeDot />}
          </span>
          {t(tab.key)}
        </NavLink>
      ))}
    </nav>
  );
}
