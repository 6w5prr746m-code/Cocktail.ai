import { Link } from "react-router-dom";
import type { Cocktail } from "../domain/types";
import { useFavoritesStore } from "../state/favorites";
import { CocktailVisual } from "./CocktailVisual";
import { tasteProfile } from "../domain/tasteProfile";
import { TasteTags } from "./TasteTags";

interface CocktailCardProps {
  cocktail: Cocktail;
  /** Largeur fixe en px pour un usage en carrousel horizontal ; omise pour un usage en grille (100% du conteneur). */
  width?: number;
  showTaste?: boolean;
}

export function CocktailCard({ cocktail, width, showTaste = true }: CocktailCardProps) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(cocktail.id));
  const tags = tasteProfile(cocktail);

  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      className={`group rounded-2xl overflow-hidden flex flex-col animate-fade-in transition-transform active:scale-[0.97] ${width ? "flex-shrink-0" : "w-full"}`}
      style={width ? { width } : undefined}
      aria-label={cocktail.name}
    >
      <div
        className="relative flex items-center justify-center aspect-square overflow-hidden"
        style={width ? { height: width } : undefined}
      >
        <CocktailVisual
          cocktail={cocktail}
          glassSize={width ? width * 0.5 : 56}
          className="transition-transform duration-300 group-hover:scale-105"
          variant="thumb"
          lazy
        />
        {isFavorite && (
          <span
            className="absolute top-2 right-2 flex items-center justify-center rounded-full text-xs"
            style={{ width: 22, height: 22, background: "rgba(0,0,0,0.35)" }}
            aria-hidden
          >
            ❤️
          </span>
        )}
      </div>
      <div className="pt-2 flex flex-col gap-1">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
          {cocktail.name}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
          {cocktail.category}
        </p>
        {showTaste && <TasteTags tags={tags.slice(0, 2)} />}
      </div>
    </Link>
  );
}
