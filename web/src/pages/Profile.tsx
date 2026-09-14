import { Link } from "react-router-dom";
import { useAllCocktails } from "../domain/catalog";
import { useHistoryStore } from "../state/history";
import { useThemeStore, applyThemeToDocument, type ThemePreference } from "../state/theme";
import { useFavoritesStore } from "../state/favorites";
import { useMyBarStore } from "../state/myBar";
import { useUserRecipesStore } from "../state/userRecipes";
import { MiniGlassBadge } from "../components/MiniGlassBadge";
import { InstallAppCard } from "../components/InstallAppCard";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Système" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
];

export default function ProfilePage() {
  const cocktails = useAllCocktails();
  const history = useHistoryStore((s) => s.entries);
  const clearHistory = useHistoryStore((s) => s.clear);
  const { preference, setPreference } = useThemeStore();

  const sortedHistory = [...history].sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  function resetAllData() {
    if (!confirm("Réinitialiser toutes tes données locales (favoris, Mon Bar, historique, recettes) ?")) return;
    clearHistory();
    useFavoritesStore.persist.clearStorage();
    useMyBarStore.persist.clearStorage();
    useUserRecipesStore.persist.clearStorage();
    window.location.reload();
  }

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-bold px-4 pt-6 pb-4" style={{ color: "var(--color-text-primary)" }}>
        Profil
      </h1>

      <div className="px-4">
        <InstallAppCard />
      </div>

      <section className="px-4 pb-6">
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
          Apparence
        </h3>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setPreference(opt.value);
                applyThemeToDocument(opt.value);
              }}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium"
              style={{
                background: preference === opt.value ? "var(--color-accent-gold)" : "var(--color-surface)",
                color: preference === opt.value ? "#0b0b0f" : "var(--color-text-primary)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 pb-6">
        <h3 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
          Historique
        </h3>
        {sortedHistory.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Prépare un cocktail jusqu'au bout pour le voir apparaître ici.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sortedHistory.map((entry) => {
              const cocktail = cocktails.find((c) => c.id === entry.cocktailId);
              if (!cocktail) return null;
              return (
                <li key={entry.id}>
                  <Link
                    to={`/cocktail/${cocktail.id}`}
                    className="flex items-center gap-3 rounded-2xl p-3"
                    style={{ background: "var(--color-surface)" }}
                  >
                    <MiniGlassBadge cocktail={cocktail} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                        {cocktail.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {new Date(entry.completedAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="px-4">
        <button
          type="button"
          onClick={resetAllData}
          className="w-full rounded-xl py-3 text-sm font-medium"
          style={{ background: "var(--color-surface)", color: "var(--color-danger)" }}
        >
          Réinitialiser mes données locales
        </button>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Cocktail.ai Web stocke tes favoris, ton bar, ton historique et tes recettes uniquement dans ce navigateur
          (localStorage) — il n'y a pas de compte ni de synchronisation entre appareils dans cette version.
        </p>
      </section>
    </div>
  );
}
