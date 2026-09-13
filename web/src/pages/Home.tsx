import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CocktailCard } from "../components/CocktailCard";
import { useAllCocktails } from "../domain/catalog";
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

  return (
    <div className="pb-8">
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-accent-gold)" }}>
          Cocktail.ai
        </p>
        <h1 className="text-3xl font-bold leading-tight mb-4" style={{ color: "var(--color-text-primary)" }}>
          Que souhaites-tu boire ce soir ?
        </h1>
        <button
          type="button"
          onClick={() => navigate("/picker")}
          className="w-full rounded-2xl py-4 font-semibold text-base"
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
