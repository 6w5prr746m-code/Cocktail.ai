import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { NotableCreatorCard } from "../components/NotableCreatorCard";
import { CocktailVisual } from "../components/CocktailVisual";
import { CompatibilityRing } from "../components/CompatibilityRing";
import { TasteTags } from "../components/TasteTags";
import { DifficultyDots } from "../components/DifficultyDots";
import { formatDuration, formatQuantity } from "../domain/formatting";
import { useAllIngredients, useCocktail } from "../domain/catalog";
import { computeAdvancedMatches } from "../domain/matchingEngine";
import { SEED_SUBSTITUTIONS } from "../domain/seed";
import { useFavoritesStore } from "../state/favorites";
import { useHistoryStore } from "../state/history";
import { useCocktailNotesStore } from "../state/cocktailNotes";
import { useMyBarStore } from "../state/myBar";
import { useShoppingListStore } from "../state/shoppingList";
import { tasteProfile } from "../domain/tasteProfile";
import { buildPhotoPrompt } from "../domain/photoPrompt";
import { type StockStatus } from "../domain/types";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useLocalizedCocktail, useLocalizedIngredients } from "../domain/i18n/useLocalizedCocktail";
import { getLocalizedTasteTags, getLocalizedUnit } from "../domain/i18n/localizedCocktail";
import { getNotableCreator } from "../domain/notableCreators";
import { isSignatureRecipe, preparedCount } from "../domain/signatureRecipe";
import { foodPairingKey } from "../domain/foodPairing";

// IMPORTANT : CocktailVisual/tasteProfile/buildPhotoPrompt tournent sur des
// heuristiques qui pattern-matchent le texte français brut (glassware/
// garnish/iceType/category) — on leur passe donc toujours `rawCocktail`
// (canonique FR), jamais `cocktail` (localisé), sous peine de casser
// silencieusement l'illustration, les tags de goût et le prompt photo.
export default function CocktailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const rawCocktail = useCocktail(id);
  const { t, locale } = useTranslation();
  const cocktail = useLocalizedCocktail(rawCocktail);
  const ingredients = useLocalizedIngredients(useAllIngredients());

  const DEGRADATION_LABEL: Record<string, string> = {
    lowStock: t("cocktailDetail.degradationLowStock"),
    almostEmptyStock: t("cocktailDetail.degradationAlmostEmpty"),
    substitution: t("cocktailDetail.degradationSubstitution"),
  };
  const isFavorite = useFavoritesStore((s) => (cocktail ? s.isFavorite(cocktail.id) : false));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const [promptCopied, setPromptCopied] = useState(false);
  const myBarEntries = useMyBarStore((s) => s.entries);
  const addShoppingItems = useShoppingListStore((s) => s.addItems);
  const historyEntries = useHistoryStore((s) => s.entries);
  const myNote = useCocktailNotesStore((s) => (cocktail ? s.notes[cocktail.id] : undefined));
  const setNote = useCocktailNotesStore((s) => s.setNote);

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
      <div className="max-w-[640px] mx-auto">
        <ScreenHeader title={t("cocktailDetail.notFoundTitle")} />
        <p className="px-4 pt-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("cocktailDetail.notFoundBody")}
        </p>
      </div>
    );
  }

  function ingredientName(ingredientId: string) {
    return ingredients.find((i) => i.id === ingredientId)?.name ?? ingredientId;
  }

  const tags = getLocalizedTasteTags(tasteProfile(rawCocktail!), locale);
  const pairingKey = foodPairingKey(rawCocktail!);
  const notableCreator = getNotableCreator(cocktail.id, locale);
  const signature = isSignatureRecipe(cocktail, historyEntries);

  async function copyPhotoPrompt() {
    if (!rawCocktail) return;
    try {
      await navigator.clipboard.writeText(buildPhotoPrompt(rawCocktail));
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      // clipboard indisponible (permission refusée, contexte non sécurisé) — pas de fallback nécessaire ici
    }
  }

  return (
    <div className="pb-28 max-w-[640px] mx-auto w-full">
      <div className="relative flex flex-col items-center justify-end overflow-hidden" style={{ height: 340 }}>
        <div className="absolute inset-0">
          <CocktailVisual cocktail={rawCocktail!} glassSize={112} />
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
                  aria-label={t("cocktailDetail.copyPhotoPromptAria")}
                  title={t("cocktailDetail.copyPhotoPromptTitle")}
                  className="flex items-center justify-center rounded-full text-sm"
                  style={{ width: 36, height: 36, background: "rgba(0,0,0,0.35)" }}
                >
                  {promptCopied ? "✓" : "📸"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(cocktail.id)}
                  aria-label={t("cocktailDetail.favoriteAria")}
                  data-testid="favorite-button"
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, background: "rgba(0,0,0,0.35)" }}
                >
                  {isFavorite ? "❤️" : "🤍"}
                </button>
                <Link
                  to={`/cocktail/${cocktail.id}/share`}
                  aria-label={t("cocktailDetail.shareAria")}
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, background: "rgba(0,0,0,0.35)" }}
                >
                  ⤴
                </Link>
                {cocktail.isUserCreated && (
                  <Link
                    to={`/recipe/${cocktail.id}/edit`}
                    aria-label={t("cocktailDetail.editAria")}
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
          {signature && (
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-accent-gold-soft)" }}>
              {t("cocktailDetail.signatureLine", { count: preparedCount(cocktail.id, historyEntries) })}
            </p>
          )}
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
              {t("cocktailDetail.ingredientsHeading")}
            </h2>
            {advanced && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {t("cocktailDetail.withMyBar")}
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
                        <span style={{ color: "var(--color-danger-text)" }} aria-label={t("cocktailDetail.missingAria")}>
                          ✗
                        </span>
                      )}
                      {status?.kind === "degraded" && (
                        <span style={{ color: "var(--color-accent-gold-text)" }} aria-label={t("cocktailDetail.degradedAria")}>
                          ⚠
                        </span>
                      )}
                      {advanced && !status && (
                        <span style={{ color: "var(--color-success-text)" }} aria-label={t("cocktailDetail.availableAria")}>
                          ✓
                        </span>
                      )}
                      <span style={{ color: "var(--color-text-primary)" }}>{ingredientName(link.ingredientId)}</span>
                      {link.isOptional && (
                        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {t("cocktailDetail.optional")}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {t(`ingredientRole.${link.role}`)}
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
                      {formatQuantity(link.quantity)} {getLocalizedUnit(link.unit, locale)}
                    </span>
                    {status?.kind === "missing" && (
                      <button
                        type="button"
                        onClick={() => addShoppingItems([link.ingredientId])}
                        aria-label={t("cocktailDetail.addToShoppingAria", { name: ingredientName(link.ingredientId) })}
                        title={t("myBar.addToShoppingTitle")}
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
              {advanced.explanation.missingIngredients.length > 1
                ? t("cocktailDetail.addMissingMany", { count: advanced.explanation.missingIngredients.length })
                : t("cocktailDetail.addMissingOne")}
            </button>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            {t("cocktailDetail.preparationHeading")}
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
            {t("cocktailDetail.glassIceGarnish", { glassware: cocktail.glassware, iceType: cocktail.iceType, garnish: cocktail.garnish })}
          </p>
        </section>

        {notableCreator && <NotableCreatorCard notable={notableCreator} />}

        <p className="text-sm rounded-2xl px-4 py-3" style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
          🍽️ {t(pairingKey)}
        </p>

        {cocktail.history && (
          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              {t("cocktailDetail.historyHeading")}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {cocktail.history} <span>— {cocktail.origin}</span>
            </p>
          </section>
        )}

        {cocktail.tips && (
          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              {t("cocktailDetail.tipsHeading")}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              💡 {cocktail.tips}
            </p>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            {t("cocktailDetail.myNoteHeading")}
          </h2>
          <textarea
            key={cocktail.id}
            defaultValue={myNote ?? ""}
            onBlur={(e) => setNote(cocktail.id, e.target.value)}
            placeholder={t("cocktailDetail.myNotePlaceholder")}
            aria-label={t("cocktailDetail.myNoteAria", { name: cocktail.name })}
            rows={3}
            className="w-full text-sm rounded-2xl px-3 py-2.5 outline-none resize-none"
            style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
          />
          <p className="text-xs mt-1.5" style={{ color: "var(--color-text-secondary)" }}>
            {t("cocktailDetail.myNotePrivateHint")}
          </p>
        </section>
      </div>

      <div
        className="sticky bottom-0 p-4 max-w-[640px] mx-auto w-full"
        style={{ background: "linear-gradient(transparent, var(--color-bg) 40%)" }}
      >
        <Link
          to={`/cocktail/${cocktail.id}/prepare`}
          className="block text-center w-full rounded-2xl py-4 font-semibold text-base"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          {t("cocktailDetail.prepareButton")}
        </Link>
      </div>
    </div>
  );
}
