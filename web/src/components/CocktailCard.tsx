import { Link } from "react-router-dom";
import type { Cocktail } from "../domain/types";
import { useFavoritesStore } from "../state/favorites";
import { CocktailVisual } from "./CocktailVisual";
import { tasteProfile } from "../domain/tasteProfile";
import { TasteTags } from "./TasteTags";
import { useTranslation } from "../domain/i18n/useTranslation";
import { getLocalizedCategory, getLocalizedTasteTags } from "../domain/i18n/localizedCocktail";

interface CocktailCardProps {
  cocktail: Cocktail;
  /** Largeur fixe en px pour un usage en carrousel horizontal ; omise pour un usage en grille (100% du conteneur). */
  width?: number;
  showTaste?: boolean;
  /** Légende optionnelle affichée à la place des tags de goût (ex: raison d'une recommandation) — évite de surcharger la carte avec les deux. */
  caption?: string;
}

// IMPORTANT : CocktailVisual/tasteProfile tournent sur des heuristiques qui
// pattern-matchent le texte français brut (glassware/garnish/iceType/
// category) — on leur passe donc toujours le cocktail canonique (FR), jamais
// une version localisée EN, sous peine de casser silencieusement l'illustration
// et les tags de goût. Seul le texte affiché (catégorie, tags) est traduit.
export function CocktailCard({ cocktail, width, showTaste = true, caption }: CocktailCardProps) {
  const { locale } = useTranslation();
  const isFavorite = useFavoritesStore((s) => s.isFavorite(cocktail.id));
  const tags = getLocalizedTasteTags(tasteProfile(cocktail), locale);

  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      className={`group rounded-2xl overflow-hidden flex flex-col animate-fade-in transition-transform active:scale-[0.97] ${width ? "flex-shrink-0" : "w-full"}`}
      style={width ? { width } : undefined}
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
          {getLocalizedCategory(cocktail.category, locale)}
        </p>
        {caption ? (
          <p className="text-[11px] truncate" style={{ color: "var(--color-accent-gold-text)" }}>
            {caption}
          </p>
        ) : (
          showTaste && <TasteTags tags={tags.slice(0, 2)} />
        )}
      </div>
    </Link>
  );
}
