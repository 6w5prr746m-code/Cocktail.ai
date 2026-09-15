import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { CocktailVisual } from "../components/CocktailVisual";
import { DifficultyDots } from "../components/DifficultyDots";
import { TasteTags } from "../components/TasteTags";
import { formatDuration, formatQuantity } from "../domain/formatting";
import { decodeSharedRecipe } from "../domain/recipeShareCode";
import { slugify } from "../domain/slug";
import { tasteProfile } from "../domain/tasteProfile";
import { useAllCocktails } from "../domain/catalog";
import type { Cocktail, CocktailIngredientLink } from "../domain/types";
import { useCustomIngredientsStore } from "../state/customIngredients";
import { useUserRecipesStore } from "../state/userRecipes";
import { useTranslation } from "../domain/i18n/useTranslation";
import { getLocalizedTasteTags, getLocalizedUnit } from "../domain/i18n/localizedCocktail";

/** Reconstruit un `Cocktail` complet (mais avec un id provisoire, non enregistré) à partir du payload partagé — permet de réutiliser tel quel CocktailVisual/tasteProfile/DifficultyDots plutôt que de dupliquer leur logique d'affichage. */
function toPreviewCocktail(payload: NonNullable<ReturnType<typeof decodeSharedRecipe>>): Cocktail {
  const ingredients: CocktailIngredientLink[] = payload.ingredients.map((i) => ({
    ingredientId: i.id,
    quantity: i.quantity,
    unit: i.unit,
    isOptional: i.isOptional,
    role: i.role,
  }));
  return {
    id: `shared-preview-${slugify(payload.name) || "recette"}`,
    name: payload.name,
    category: payload.category,
    origin: payload.origin,
    history: payload.history,
    difficulty: payload.difficulty,
    mainSpirit: payload.mainSpirit,
    preparationTimeMinutes: payload.preparationTimeMinutes,
    glassware: payload.glassware,
    iceType: payload.iceType,
    garnish: payload.garnish,
    tips: payload.tips,
    imageURL: "",
    ingredients,
    steps: payload.steps,
    variantIds: [],
    isUserCreated: true,
  };
}

export default function SharedRecipePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const findOrCreateIngredient = useCustomIngredientsStore().findOrCreate;
  const upsert = useUserRecipesStore((s) => s.upsert);
  const allCocktails = useAllCocktails();

  const payload = useMemo(() => (code ? decodeSharedRecipe(code) : null), [code]);
  const preview = useMemo(() => (payload ? toPreviewCocktail(payload) : null), [payload]);

  if (!payload || !preview) {
    return (
      <div className="max-w-[640px] mx-auto">
        <ScreenHeader title={t("sharedRecipe.title")} />
        <p className="px-4 pt-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("sharedRecipe.invalidLink")}
        </p>
      </div>
    );
  }

  const ingredientNames = new Map(payload.ingredients.map((i) => [i.id, i.name]));
  const tags = getLocalizedTasteTags(tasteProfile(preview), locale);

  function saveToMyRecipes() {
    const resolvedIngredients: CocktailIngredientLink[] = payload!.ingredients.map((i) => {
      const ingredient = findOrCreateIngredient(i.name, i.category);
      return { ingredientId: ingredient.id, quantity: i.quantity, unit: i.unit, isOptional: i.isOptional, role: i.role };
    });

    const takenIds = new Set(allCocktails.map((c) => c.id));
    let id = slugify(payload!.name) || "recette";
    let suffix = 1;
    while (takenIds.has(id)) {
      suffix += 1;
      id = `${slugify(payload!.name) || "recette"}_${suffix}`;
    }

    const cocktail: Cocktail = { ...preview!, id, ingredients: resolvedIngredients };
    upsert(cocktail);
    navigate(`/cocktail/${id}`);
  }

  return (
    <div className="pb-28 max-w-[640px] mx-auto w-full">
      <div className="relative flex flex-col items-center justify-end overflow-hidden" style={{ height: 300 }}>
        <div className="absolute inset-0">
          <CocktailVisual cocktail={preview} glassSize={100} />
        </div>
        <div className="absolute top-0 left-0 right-0">
          <ScreenHeader transparent onBack={() => navigate(-1)} />
        </div>
        <div className="relative z-10 p-5 pt-4 w-full text-center" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75 mb-1.5">{t("sharedRecipe.title")}</p>
          <h1 className="text-3xl font-bold text-white leading-tight">{preview.name}</h1>
          <div className="flex items-center justify-center gap-3 mt-2 text-sm text-white/85">
            <span>⏱ {formatDuration(preview.preparationTimeMinutes)}</span>
            <span className="flex items-center gap-1.5">
              • <DifficultyDots level={preview.difficulty} />
            </span>
            <span>• {preview.mainSpirit}</span>
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
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            {t("cocktailDetail.ingredientsHeading")}
          </h2>
          <ul className="flex flex-col gap-2">
            {payload.ingredients.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                style={{ background: "var(--color-surface)" }}
              >
                <div className="min-w-0 flex items-center gap-1.5">
                  <span style={{ color: "var(--color-text-primary)" }}>{ingredientNames.get(i.id) ?? i.name}</span>
                  {i.isOptional && (
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {t("cocktailDetail.optional")}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {t(`ingredientRole.${i.role}`)}
                  </span>
                </div>
                <span className="font-mono text-sm flex-shrink-0" style={{ color: "var(--color-accent-gold-text)" }}>
                  {formatQuantity(i.quantity)} {getLocalizedUnit(i.unit, locale)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            {t("cocktailDetail.preparationHeading")}
          </h2>
          <ol className="flex flex-col gap-3">
            {payload.steps.map((step) => (
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
            {t("cocktailDetail.glassIceGarnish", { glassware: preview.glassware, iceType: preview.iceType, garnish: preview.garnish })}
          </p>
        </section>

        {preview.tips && (
          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              {t("cocktailDetail.tipsHeading")}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              💡 {preview.tips}
            </p>
          </section>
        )}

        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {t("sharedRecipe.saveNote")}
        </p>
      </div>

      <div
        className="sticky bottom-0 p-4 max-w-[640px] mx-auto w-full"
        style={{ background: "linear-gradient(transparent, var(--color-bg) 40%)" }}
      >
        <button
          type="button"
          onClick={saveToMyRecipes}
          className="w-full rounded-2xl py-4 font-semibold text-base"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          {t("sharedRecipe.saveButton")}
        </button>
      </div>
    </div>
  );
}
