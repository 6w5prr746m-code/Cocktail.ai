import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "../domain/i18n/useTranslation";
import { NAV_TABS } from "./navTabs";

export const SIDE_NAV_WIDTH = 232;

// Barre latérale desktop (≥ lg) — remplace la TabBar du bas, cachée en
// dessous de ce seuil. Même 5 destinations, présentation verticale.
export function SideNav() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t("tabBar.desktopNavLabel")}
      className="hidden lg:flex flex-col flex-shrink-0 gap-1 p-4 border-r sticky top-0 self-start"
      style={{ width: SIDE_NAV_WIDTH, height: "100svh", background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <Link
        to="/"
        className="px-3 pt-4 pb-6 text-xl font-bold"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
      >
        🍸 Cocktail.ai
      </Link>
      {NAV_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
          style={({ isActive }) => ({
            background: isActive ? "var(--color-accent-gold)" : "transparent",
            color: isActive ? "#0b0b0f" : "var(--color-text-primary)",
          })}
        >
          <span style={{ fontSize: 18 }} aria-hidden>
            {tab.icon}
          </span>
          {t(tab.key)}
        </NavLink>
      ))}
    </nav>
  );
}
