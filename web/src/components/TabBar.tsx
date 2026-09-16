import { NavLink } from "react-router-dom";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useAlmostReadyMatches } from "../hooks/useAlmostReadyMatches";
import { NAV_TABS } from "./navTabs";
import { NavBadgeDot } from "./NavBadgeDot";

// Visible en dessous du breakpoint desktop (lg) — au-delà, SideNav prend le relais.
export function TabBar() {
  const { t } = useTranslation();
  const almostReadyCount = useAlmostReadyMatches().length;
  return (
    <nav
      aria-label={t("tabBar.mobileNavLabel")}
      className="lg:hidden sticky bottom-0 left-0 right-0 flex justify-around items-stretch border-t"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `tab-link relative flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${isActive ? "is-active" : ""}`}
          style={({ isActive }) => ({ color: isActive ? "var(--color-accent-gold-text)" : "var(--color-text-secondary)" })}
        >
          <span className="tab-link-icon-wrap relative" style={{ fontSize: 20 }}>
            {tab.icon}
            {tab.to === "/mybar" && almostReadyCount > 0 && <NavBadgeDot />}
          </span>
          {t(tab.key)}
          <span className="tab-link-dot" aria-hidden />
        </NavLink>
      ))}
    </nav>
  );
}
