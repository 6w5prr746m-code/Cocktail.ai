import { Link } from "react-router-dom";
import { useAllCocktails } from "../domain/catalog";
import { useFavoritesStore } from "../state/favorites";
import { MiniGlassBadge } from "../components/MiniGlassBadge";
import { GlassArt } from "../components/GlassArt";
import type { CocktailArt } from "../domain/glassArt";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useLocalizedCocktail } from "../domain/i18n/useLocalizedCocktail";

const EMPTY_STATE_ART: CocktailArt = { shape: "coupe", liquidColor: "#e8d9a8", garnish: "none", ice: "none" };

function FavoriteRow({ cocktail, onRemove }: { cocktail: ReturnType<typeof useAllCocktails>[number]; onRemove: () => void }) {
  const { t } = useTranslation();
  const localized = useLocalizedCocktail(cocktail);
  return (
    <li className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--color-surface)" }}>
      <Link to={`/cocktail/${cocktail.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <MiniGlassBadge cocktail={cocktail} />
        <div className="min-w-0">
          <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
            {localized.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
            {localized.category}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("favorites.remove", { name: localized.name })}
        className="flex-shrink-0 rounded-full flex items-center justify-center"
        style={{ width: 32, height: 32, background: "var(--color-bg)" }}
      >
        ❤️
      </button>
    </li>
  );
}

export default function FavoritesPage() {
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const cocktails = useAllCocktails();
  const favorites = favoriteIds.map((id) => cocktails.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const { t } = useTranslation();

  return (
    <div className="pb-8 max-w-[640px] mx-auto">
      <h1 className="text-2xl font-bold px-4 pt-6 pb-4" style={{ color: "var(--color-text-primary)" }}>
        {t("favorites.title")}
      </h1>
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center mt-8 gap-3 text-center px-6">
          <div className="opacity-80">
            <GlassArt art={EMPTY_STATE_ART} size={72} fillFraction={0} />
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {t("favorites.empty")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {favorites.map((c) => (
            <FavoriteRow key={c.id} cocktail={c} onRemove={() => toggleFavorite(c.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}
