import { Link } from "react-router-dom";
import { useAllCocktails } from "../domain/catalog";
import { useFavoritesStore } from "../state/favorites";
import { gradientClassFor } from "../domain/gradient";

export default function FavoritesPage() {
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const cocktails = useAllCocktails();
  const favorites = favoriteIds.map((id) => cocktails.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-bold px-4 pt-6 pb-4" style={{ color: "var(--color-text-primary)" }}>
        Favoris
      </h1>
      {favorites.length === 0 ? (
        <p className="px-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Aucun favori pour l'instant. Ajoute des cocktails en favori depuis leur fiche.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {favorites.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--color-surface)" }}>
              <Link to={`/cocktail/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`rounded-xl flex-shrink-0 ${gradientClassFor(c.category)}`} style={{ width: 48, height: 48 }} />
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                    {c.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                    {c.category}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => toggleFavorite(c.id)}
                aria-label={`Retirer ${c.name} des favoris`}
                className="flex-shrink-0 rounded-full flex items-center justify-center"
                style={{ width: 32, height: 32, background: "var(--color-bg)" }}
              >
                ❤️
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
