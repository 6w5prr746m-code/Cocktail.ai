import { NavLink } from "react-router-dom";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useAlmostReadyMatches } from "../hooks/useAlmostReadyMatches";
import { NAV_TABS } from "./navTabs";
import { NavBadgeDot } from "./NavBadgeDot";

// Visible en dessous du breakpoint desktop (lg) — au-delà, SideNav prend le
// relais. Variante "Apple-like" : fond en verre dépoli façon barre d'onglets
// iOS, la couleur de chaque item (voir navTabs.ts) signale l'état actif —
// pas de halo ni de point, juste l'icône qui grossit légèrement.
export function TabBar() {
  const { t } = useTranslation();
  const almostReadyCount = useAlmostReadyMatches().length;
  return (
    <nav
      aria-label={t("tabBar.mobileNavLabel")}
      className="app-chrome lg:hidden sticky bottom-0 left-0 right-0 flex justify-around items-stretch border-t"
      style={{
        background: "color-mix(in srgb, var(--color-surface) 75%, transparent)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderColor: "var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `tab-link relative flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${isActive ? "is-active" : ""}`}
          style={({ isActive }) => ({ color: isActive ? tab.tint : "var(--color-text-secondary)" })}
        >
          <span className="tab-link-icon-wrap relative" style={{ fontSize: 20 }}>
            {tab.icon}
            {tab.to === "/mybar" && almostReadyCount > 0 && <NavBadgeDot />}
          </span>
          {t(tab.key)}
        </NavLink>
      ))}
    </nav>
  );
}
