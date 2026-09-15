import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Accueil", icon: "🏠", end: true },
  { to: "/library", label: "Bibliothèque", icon: "📚", end: false },
  { to: "/mybar", label: "Mon Bar", icon: "🥃", end: false },
  { to: "/favorites", label: "Favoris", icon: "❤️", end: false },
  { to: "/profile", label: "Profil", icon: "👤", end: false },
];

export function TabBar() {
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
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
