import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { CocktailVisual } from "../components/CocktailVisual";
import { CompatibilityRing } from "../components/CompatibilityRing";
import { TasteTags } from "../components/TasteTags";
import { DifficultyDots } from "../components/DifficultyDots";
import { formatDuration, formatQuantity } from "../domain/formatting";
import { useAllIngredients, useCocktail } from "../domain/catalog";
import { computeAdvancedMatches } from "../domain/matchingEngine";
import { SEED_SUBSTITUTIONS } from "../domain/seed";
import { useFavoritesStore } from "../state/favorites";
import { useMyBarStore } from "../state/myBar";
import { useShoppingListStore } from "../state/shoppingList";
import { tasteProfile } from "../domain/tasteProfile";
import { buildPhotoPrompt } from "../domain/photoPrompt";
import { INGREDIENT_ROLE_LABEL, type StockStatus } from "../domain/types";

const DEGRADATION_LABEL: Record<string, string> = {
  lowStock: "stock faible dans Mon Bar",
  almostEmptyStock: "presque terminé dans Mon Bar",
  substitution: "remplacé par un ingrédient de Mon Bar",
};

export default function CocktailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cocktail = useCocktail(id);
  const ingredients = useAllIngredients();
  const isFavorite = useFavoritesStore((s) => (cocktail ? s.isFavorite(cocktail.id) : false));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const [promptCopied, setPromptCopied] = useState(false);
  const myBarEntries = useMyBarStore((s) => s.entries);
  const addShoppingItems = useShoppingListStore((s) => s.addItems);

  // Confronte cette recette à Mon Bar — n'affiche rien tant que le bar est
  // vide, pour ne pas polluer l'écran d'un utilisateur qui n'a encore rien
  // renseigné. Le moteur V2 tourne déjà côté Mon Bar (score, dégradations,
  // substitutions) ; on l'exploite ici au niveau d'un seul cocktail pour
  // expliquer concrètement le score plutôt que de le laisser invisible.
  const advanced = useMemo(() => {
    if (!cocktail || Object.keys(myBarEntries).length === 0) return null;
    const inventory = new Map<string, StockStatus>();
    for (const entry of Object.values(myBarEntries)) inventory.set(entry.ingredientId, entry.stockStatus);
    const [result] = computeAdvancedMatches(inventory, [cocktail], SEED_SUBSTITUTIONS);
    return result ?? null;
  }, [cocktail, myBarEntries]);

  const ingredientStatus = useMemo(() => {
    const map = new Map<string, { kind: "missing" } | { kind: "degraded"; reason: string }>();
    if (!advanced) return map;
    for (const m of advanced.explanation.missingIngredients) map.set(m.ingredient.id, { kind: "missing" });
    for (const d of advanced.explanation.degradedIngredients) {
      map.set(d.ingredient.id, { kind: "degraded", reason: DEGRADATION_LABEL[d.reason.kind] ?? "" });
    }
    return map;
  }, [advanced]);

  if (!cocktail) {
    return (
      <div>
        <ScreenHeader title="Cocktail introuvable" />
        <p className="px-4 pt-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Ce cocktail n'existe pas ou a été supprimé.
        </p>
      </div>
    );
  }

  function ingredientName(ingredientId: string) {
    return ingredients.find((i) => i.id === ingredientId)?.name ?? ingredientId;
  }

  const tags = tasteProfile(cocktail);

  async function copyPhotoPrompt() {
    if (!cocktail) return;
    try {
      await navigator.clipboard.writeText(buildPhotoPrompt(cocktail));
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      // clipboard indisponible (permission refusée, contexte non sécurisé) — pas de fallback nécessaire ici
    }
  }

  return (
    <div className="pb-28">
      <div className="relative flex flex-col items-center justify-end overflow-hidden" style={{ height: 340 }}>
        <div className="absolute inset-0">
          <CocktailVisual cocktail={cocktail} glassSize={112} />
        </div>
        <div className="absolute top-0 left-0 right-0">
          <ScreenHeader
            transparent
            onBack={() => navigate(-1)}
            action={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyPhotoPrompt}
                  aria-label="Copier le prompt photo"
                  title="Copier un prompt de génération de photo réaliste pour ce cocktail"
                  className="flex items-center justify-center rounded-full text-sm"
                  style={{ width: 36, height: 36, background: "rgba(0,0,0,0.35)" }}
                >
                  {promptCopied ? "✓" : "📸"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(cocktail.id)}
                  aria-label="Favori"
                  data-testid="favorite-button"
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, background: "rgba(0,0,0,0.35)" }}
                >
                  {isFavorite ? "❤️" : "🤍"}
                </button>
                <Link
                  to={`/cocktail/${cocktail.id}/share`}
                  aria-label="Partager"
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, background: "rgba(0,0,0,0.35)" }}
                >
                  ⤴
                </Link>
                {cocktail.isUserCreated && (
                  <Link
                    to={`/recipe/${cocktail.id}/edit`}
                    aria-label="Modifier"
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 36, height: 36, background: "rgba(0,0,0,0.35)" }}
                  >
                    ✎
                  </Link>
                )}
              </div>
            }
          />
        </div>

        <div className="relative z-10 p-5 pt-4 w-full text-center" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
          <h1 className="text-3xl font-bold text-white leading-tight">{cocktail.name}</h1>
          <div className="flex items-center justify-center gap-3 mt-2 text-sm text-white/85">
            <span>⏱ {formatDuration(cocktail.preparationTimeMinutes)}</span>
            <span className="flex items-center gap-1.5">
              • <DifficultyDots level={cocktail.difficulty} />
            </span>
            <span>• {cocktail.mainSpirit}</span>
          </div>
          {tags.length > 0 && (
            <div className="flex justify-center mt-3">
              <TasteTags tags={tags} variant="onImage" />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-5 flex flex-col gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Ingrédients
            </h2>
            {advanced && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  avec Mon Bar
                </span>
                <CompatibilityRing fraction={advanced.compatibilityScore} size={32} strokeWidth={4} />
              </div>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {cocktail.ingredients.map((link) => {
              const status = ingredientStatus.get(link.ingredientId);
              return (
                <li
                  key={link.ingredientId}
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                  style={{ background: "var(--color-surface)" }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {status?.kind === "missing" && (
                        <span style={{ color: "var(--color-danger-text)" }} aria-label="Manquant">
                          ✗
                        </span>
                      )}
                      {status?.kind === "degraded" && (
                        <span style={{ color: "var(--color-accent-gold-text)" }} aria-label="Disponible partiellement">
                          ⚠
                        </span>
                      )}
                      {advanced && !status && (
                        <span style={{ color: "var(--color-success-text)" }} aria-label="Disponible">
                          ✓
                        </span>
                      )}
                      <span style={{ color: "var(--color-text-primary)" }}>{ingredientName(link.ingredientId)}</span>
                      {link.isOptional && (
                        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          optionnel
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {INGREDIENT_ROLE_LABEL[link.role]}
                      </span>
                    </div>
                    {status?.kind === "degraded" && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        {status.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-sm" style={{ color: "var(--color-accent-gold-text)" }}>
                      {formatQuantity(link.quantity)} {link.unit}
                    </span>
                    {status?.kind === "missing" && (
                      <button
                        type="button"
                        onClick={() => addShoppingItems([link.ingredientId])}
                        aria-label={`Ajouter ${ingredientName(link.ingredientId)} à la liste de courses`}
                        title="Ajouter à la liste de courses"
                        className="rounded-full flex items-center justify-center"
                        style={{ width: 26, height: 26, background: "var(--color-bg)" }}
                      >
                        🛒
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {advanced && advanced.explanation.missingIngredients.length > 0 && (
            <button
              type="button"
              onClick={() => addShoppingItems(advanced.explanation.missingIngredients.map((m) => m.ingredient.id))}
              className="w-full mt-3 rounded-xl py-2.5 text-sm font-medium"
              style={{ background: "var(--color-surface)", color: "var(--color-accent-gold-text)" }}
            >
              🛒 Ajouter les {advanced.explanation.missingIngredients.length} ingrédient
              {advanced.explanation.missingIngredients.length > 1 ? "s" : ""} manquant
              {advanced.explanation.missingIngredients.length > 1 ? "s" : ""} à ma liste de courses
            </button>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            Préparation
          </h2>
          <ol className="flex flex-col gap-3">
            {cocktail.steps.map((step) => (
              <li key={step.order} className="flex gap-3">
                <span
                  className="flex-shrink-0 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ width: 26, height: 26, background: "var(--color-accent-gold)", color: "#0b0b0f" }}
                >
                  {step.order}
                </span>
                <p className="text-sm pt-0.5" style={{ color: "var(--color-text-primary)" }}>
                  {step.instruction}
                  {step.durationSeconds && (
                    <span className="ml-1.5" style={{ color: "var(--color-text-secondary)" }}>
                      ({step.durationSeconds}s)
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ol>
          <p className="text-xs mt-3" style={{ color: "var(--color-text-secondary)" }}>
            {cocktail.glassware} • {cocktail.iceType} • Garniture : {cocktail.garnish}
          </p>
        </section>

        {cocktail.history && (
          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              Histoire
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {cocktail.history} <span>— {cocktail.origin}</span>
            </p>
          </section>
        )}

        {cocktail.tips && (
          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              Conseils
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              💡 {cocktail.tips}
            </p>
          </section>
        )}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 p-4"
        style={{ maxWidth: 560, margin: "0 auto", background: "linear-gradient(transparent, var(--color-bg) 40%)" }}
      >
        <Link
          to={`/cocktail/${cocktail.id}/prepare`}
          className="block text-center w-full rounded-2xl py-4 font-semibold text-base"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          Préparer
        </Link>
      </div>
    </div>
  );
}
