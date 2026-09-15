import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CocktailCard } from "../components/CocktailCard";
import { CocktailVisual } from "../components/CocktailVisual";
import { TasteTags } from "../components/TasteTags";
import { useAllCocktails } from "../domain/catalog";
import { dailyPick } from "../domain/gradient";
import { pickSurprise, recommendCocktails } from "../domain/recommendation";
import { tasteProfile } from "../domain/tasteProfile";
import { useFavoritesStore } from "../state/favorites";
import { useHistoryStore } from "../state/history";
import { useUserRecipesStore } from "../state/userRecipes";
import type { Cocktail } from "../domain/types";

const SECTION_LIMIT = 20;

function Section({
  title,
  subtitle,
  cocktails,
  emptyHint,
}: {
  title: string;
  subtitle?: string;
  cocktails: Cocktail[];
  emptyHint?: string;
}) {
  if (cocktails.length === 0 && !emptyHint) return null;
  return (
    <section className="mt-7">
      <div className="px-4 mb-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>
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
  const tags = tasteProfile(cocktail);

  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      className="relative block overflow-hidden rounded-3xl animate-fade-in transition-transform active:scale-[0.98]"
      style={{ height: 220 }}
    >
      <div className="absolute inset-0">
        <CocktailVisual cocktail={cocktail} glassSize={92} variant="full" />
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 35%, rgba(0,0,0,0.78))" }} />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75 mb-1.5">Le cocktail du jour</p>
        <h2 className="text-2xl font-bold text-white leading-tight mb-2">{cocktail.name}</h2>
        <TasteTags tags={tags} size="md" variant="onImage" />
        <p className="text-sm text-white/85 mt-3 font-medium">Découvrir la recette →</p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const cocktails = useAllCocktails();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const historyEntries = useHistoryStore((s) => s.entries);
  const userRecipes = useUserRecipesStore((s) => s.recipes);
  const [surpriseFlash, setSurpriseFlash] = useState(false);

  // Heuristique simple documentée (voir README iOS, Sprint 2) — en attendant
  // la fonction communautaire réelle.
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

  const historyCocktailIds = useMemo(() => historyEntries.map((e) => e.cocktailId), [historyEntries]);
  const hasTasteSignal = favoriteIds.length > 0 || historyCocktailIds.length > 0;

  const recommended = useMemo(
    () => recommendCocktails(cocktails, { favoriteIds, historyCocktailIds }, SECTION_LIMIT),
    [cocktails, favoriteIds, historyCocktailIds],
  );

  const favorites = useMemo(
    () => favoriteIds.map((id) => cocktails.find((c) => c.id === id)).filter((c): c is Cocktail => Boolean(c)),
    [cocktails, favoriteIds],
  );

  const featured = useMemo(() => dailyPick(cocktails), [cocktails]);

  function surpriseMe() {
    const excluded = new Set([...favoriteIds, ...historyCocktailIds]);
    const pick = pickSurprise(cocktails, excluded);
    if (!pick) return;
    setSurpriseFlash(true);
    setTimeout(() => navigate(`/cocktail/${pick.id}`), 220);
  }

  return (
    <div className="pb-8">
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-accent-gold-text)" }}>
          Cocktail.ai
        </p>
        <h1 className="text-3xl font-bold leading-tight mb-4" style={{ color: "var(--color-text-primary)" }}>
          Que souhaites-tu boire ce soir ?
        </h1>

        {featured && <FeaturedCocktail cocktail={featured} />}

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => navigate("/picker")}
            className="flex-1 rounded-2xl py-4 font-semibold text-base"
            style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
          >
            ✨ Ajouter mes ingrédients
          </button>
          <button
            type="button"
            onClick={surpriseMe}
            aria-label="Surprends-moi avec un cocktail au hasard"
            title="Surprends-moi"
            className="rounded-2xl px-5 font-semibold text-base transition-transform"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              transform: surpriseFlash ? "rotate(18deg) scale(1.1)" : undefined,
            }}
          >
            🎲
          </button>
        </div>
      </div>

      <Section title="Populaires" cocktails={popular} />
      <Section title="Nouveautés" cocktails={fresh} />
      <Section
        title="Recommandés pour toi"
        subtitle={hasTasteSignal ? "Basé sur tes favoris et cocktails déjà préparés" : undefined}
        cocktails={recommended}
      />
      <Section
        title="Tes favoris"
        cocktails={favorites}
        emptyHint="Ajoute des cocktails en favori depuis leur fiche pour les retrouver ici."
      />
    </div>
  );
}
