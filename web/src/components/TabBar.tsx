import { NavLink } from "react-router-dom";
import { useTranslation } from "../domain/i18n/useTranslation";
import { NAV_TABS } from "./navTabs";

// Visible en dessous du breakpoint desktop (lg) — au-delà, SideNav prend le relais.
export function TabBar() {
  const { t } = useTranslation();
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
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium"
          style={({ isActive }) => ({ color: isActive ? "var(--color-accent-gold-text)" : "var(--color-text-secondary)" })}
        >
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          {t(tab.key)}
        </NavLink>
      ))}
    </nav>
  );
}
