import { NavLink } from "react-router-dom";
import { useTranslation } from "../domain/i18n/useTranslation";

const TABS = [
  { to: "/", key: "tabBar.home", icon: "🏠", end: true },
  { to: "/library", key: "tabBar.library", icon: "📚", end: false },
  { to: "/mybar", key: "tabBar.myBar", icon: "🥃", end: false },
  { to: "/favorites", key: "tabBar.favorites", icon: "❤️", end: false },
  { to: "/profile", key: "tabBar.profile", icon: "👤", end: false },
] as const;

export function TabBar() {
  const { t } = useTranslation();
  return (
    <nav
      className="sticky bottom-0 left-0 right-0 flex justify-around items-stretch border-t"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => (
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
