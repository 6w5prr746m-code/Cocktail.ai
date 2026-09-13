import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CocktailCard } from "../components/CocktailCard";
import { GlassArt } from "../components/GlassArt";
import { TasteTags } from "../components/TasteTags";
import { useAllCocktails } from "../domain/catalog";
import { artFor } from "../domain/glassArt";
import { gradientClassFor, dailyPick } from "../domain/gradient";
import { tasteProfile } from "../domain/tasteProfile";
import { useFavoritesStore } from "../state/favorites";
import { useUserRecipesStore } from "../state/userRecipes";
import type { Cocktail } from "../domain/types";

const SECTION_LIMIT = 20;

function Section({ title, cocktails, emptyHint }: { title: string; cocktails: Cocktail[]; emptyHint?: string }) {
  if (cocktails.length === 0 && !emptyHint) return null;
  return (
    <section className="mt-7">
      <h3 className="text-lg font-semibold px-4 mb-3" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </h3>
      {cocktails.length === 0 ? (
        <p className="px-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {emptyHint}
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollSnapType: "x proximity" }}>
          {cocktails.map((c) => (
            <div key={c.id} style={{ scrollSnapAlign: "start" }}>
              <CocktailCard cocktail={c} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedCocktail({ cocktail }: { cocktail: Cocktail }) {
  const art = artFor(cocktail);
  const tags = tasteProfile(cocktail);

  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      className={`relative flex items-center justify-between overflow-hidden rounded-3xl p-5 animate-fade-in transition-transform active:scale-[0.98] ${gradientClassFor(cocktail.category)}`}
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 15% 15%, rgba(255,255,255,0.35), transparent 55%)" }} />
      <div className="relative z-10 max-w-[58%]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75 mb-1.5">Le cocktail du jour</p>
        <h2 className="text-2xl font-bold text-white leading-tight mb-2">{cocktail.name}</h2>
        <TasteTags tags={tags} size="md" variant="onImage" />
        <p className="text-sm text-white/85 mt-3 font-medium">Découvrir la recette →</p>
      </div>
      <div className="relative z-10 flex-shrink-0" style={{ color: "rgba(255,255,255,0.92)" }}>
        <GlassArt art={art} size={92} strokeColor="rgba(255,255,255,0.92)" />
      </div>
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const cocktails = useAllCocktails();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const userRecipes = useUserRecipesStore((s) => s.recipes);

  // Heuristiques simples documentées (voir README iOS, Sprint 2 / Sprint 10) —
  // en attendant respectivement la fonction communautaire et un vrai
  // RecommendationEngine V2.
  const popular = useMemo(
    () =>
      [...cocktails]
        .sort((a, b) => {
          const aClassic = a.category === "Classique" ? 0 : 1;
          const bClassic = b.category === "Classique" ? 0 : 1;
          if (aClassic !== bClassic) return aClassic - bClassic;
          return a.name.localeCompare(b.name, "fr");
        })
        .slice(0, SECTION_LIMIT),
    [cocktails],
  );

  const fresh = useMemo(() => {
    const newest = [...userRecipes].reverse();
    const seedRecent = cocktails.filter((c) => !c.isUserCreated).slice(-9).reverse();
    return [...newest, ...seedRecent].slice(0, SECTION_LIMIT);
  }, [cocktails, userRecipes]);

  const recommended = useMemo(
    () =>
      [...cocktails]
        .filter((c) => !favoriteIds.includes(c.id))
        .sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name, "fr"))
        .slice(0, SECTION_LIMIT),
    [cocktails, favoriteIds],
  );

  const favorites = useMemo(
    () => favoriteIds.map((id) => cocktails.find((c) => c.id === id)).filter((c): c is Cocktail => Boolean(c)),
    [cocktails, favoriteIds],
  );

  const featured = useMemo(() => dailyPick(cocktails), [cocktails]);

  return (
    <div className="pb-8">
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-accent-gold)" }}>
          Cocktail.ai
        </p>
        <h1 className="text-3xl font-bold leading-tight mb-4" style={{ color: "var(--color-text-primary)" }}>
          Que souhaites-tu boire ce soir ?
        </h1>

        {featured && <FeaturedCocktail cocktail={featured} />}

        <button
          type="button"
          onClick={() => navigate("/picker")}
          className="w-full rounded-2xl py-4 font-semibold text-base mt-3"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          ✨ Ajouter mes ingrédients
        </button>
      </div>

      <Section title="Populaires" cocktails={popular} />
      <Section title="Nouveautés" cocktails={fresh} />
      <Section title="Recommandés pour toi" cocktails={recommended} />
      <Section
        title="Tes favoris"
        cocktails={favorites}
        emptyHint="Ajoute des cocktails en favori depuis leur fiche pour les retrouver ici."
      />
    </div>
  );
}
