import { Link } from "react-router-dom";
import { useAllCocktails } from "../domain/catalog";
import { useFavoritesStore } from "../state/favorites";
import { MiniGlassBadge } from "../components/MiniGlassBadge";
import { GlassArt } from "../components/GlassArt";
import type { CocktailArt } from "../domain/glassArt";

const EMPTY_STATE_ART: CocktailArt = { shape: "coupe", liquidColor: "#e8d9a8", garnish: "none", ice: "none" };

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
        <div className="flex flex-col items-center mt-8 gap-3 text-center px-6">
          <div className="opacity-80">
            <GlassArt art={EMPTY_STATE_ART} size={72} fillFraction={0} />
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Aucun favori pour l'instant. Ajoute des cocktails en favori depuis leur fiche.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {favorites.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--color-surface)" }}>
              <Link to={`/cocktail/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <MiniGlassBadge cocktail={c} />
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
