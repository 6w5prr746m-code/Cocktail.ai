import { Link } from "react-router-dom";
import type { Cocktail } from "../domain/types";
import { gradientClassFor } from "../domain/gradient";
import { useFavoritesStore } from "../state/favorites";

const CATEGORY_ICON: Record<string, string> = {
  Tropical: "🍹",
  Tiki: "🗿",
  Classique: "🍸",
  Moderne: "✨",
  "Sans alcool": "🌿",
  Apéritif: "🍷",
  Hiver: "☕️",
};

interface CocktailCardProps {
  cocktail: Cocktail;
  /** Largeur fixe en px pour un usage en carrousel horizontal ; omise pour un usage en grille (100% du conteneur). */
  width?: number;
}

export function CocktailCard({ cocktail, width }: CocktailCardProps) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(cocktail.id));
  const icon = CATEGORY_ICON[cocktail.category] ?? "🍸";
  const fontSize = width ? width * 0.32 : undefined;

  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      className={`rounded-2xl overflow-hidden flex flex-col animate-fade-in ${width ? "flex-shrink-0" : "w-full"}`}
      style={width ? { width } : undefined}
      aria-label={cocktail.name}
    >
      <div
        className={`relative flex items-center justify-center aspect-square ${gradientClassFor(cocktail.category)}`}
        style={width ? { height: width } : undefined}
      >
        <span className="text-5xl" style={fontSize ? { fontSize } : undefined}>
          {icon}
        </span>
        {isFavorite && (
          <span className="absolute top-2 right-2 text-sm drop-shadow" aria-hidden>
            ❤️
          </span>
        )}
      </div>
      <div className="pt-2">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
          {cocktail.name}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
          {cocktail.category}
        </p>
      </div>
    </Link>
  );
}
