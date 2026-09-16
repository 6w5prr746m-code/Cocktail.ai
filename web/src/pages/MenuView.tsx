import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { CocktailVisual } from "../components/CocktailVisual";
import { TasteTags } from "../components/TasteTags";
import { useAllCocktails, useAllIngredients } from "../domain/catalog";
import { decodeMenu, type MenuItem } from "../domain/menuShareCode";
import { formatCurrency } from "../domain/formatting";
import { tasteProfile } from "../domain/tasteProfile";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useLocalizedIngredients } from "../domain/i18n/useLocalizedCocktail";
import { getLocalizedTasteTags } from "../domain/i18n/localizedCocktail";
import type { Cocktail } from "../domain/types";

// IMPORTANT : CocktailVisual/tasteProfile tournent sur des heuristiques qui
// pattern-matchent le texte français brut — on leur passe donc toujours le
// cocktail canonique (voir le même commentaire dans CocktailCard.tsx). Les
// items d'une carte ne référencent que des cocktails du catalogue (jamais
// une recette perso), qui sont déjà canoniques.
function MenuCocktailCard({ cocktail, price, ingredientNameById }: { cocktail: Cocktail; price: number | null; ingredientNameById: Map<string, string> }) {
  const { locale } = useTranslation();
  const tags = getLocalizedTasteTags(tasteProfile(cocktail), locale);
  const ingredientNames = cocktail.ingredients.map((link) => ingredientNameById.get(link.ingredientId) ?? link.ingredientId);

  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      className="block rounded-3xl overflow-hidden glass-card animate-fade-in transition-transform active:scale-[0.98]"
    >
      <div className="relative" style={{ aspectRatio: "4 / 3" }}>
        <CocktailVisual cocktail={cocktail} glassSize={76} variant="thumb" lazy />
        <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,0.85))" }} />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-white leading-tight">{cocktail.name}</h2>
            {price !== null && (
              <span className="flex-shrink-0 text-lg font-bold text-white">{formatCurrency(price)}</span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="mt-1.5">
              <TasteTags tags={tags} variant="onImage" />
            </div>
          )}
        </div>
      </div>
      {ingredientNames.length > 0 && (
        <p className="px-4 py-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {ingredientNames.join(" · ")}
        </p>
      )}
    </Link>
  );
}

export default function MenuViewPage() {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const cocktails = useAllCocktails();
  const ingredients = useLocalizedIngredients(useAllIngredients());
  const ingredientNameById = useMemo(() => new Map(ingredients.map((i) => [i.id, i.name])), [ingredients]);

  const payload = useMemo(() => (code ? decodeMenu(code) : null), [code]);

  const rows = useMemo(() => {
    if (!payload) return [];
    return payload.items
      .map((item) => ({ item, cocktail: cocktails.find((c) => c.id === item.cocktailId) }))
      .filter((row): row is { item: MenuItem; cocktail: Cocktail } => Boolean(row.cocktail));
  }, [payload, cocktails]);

  if (!payload) {
    return (
      <div className="max-w-[640px] mx-auto">
        <ScreenHeader title={t("menuView.title")} />
        <p className="px-4 pt-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("menuView.invalidLink")}
        </p>
      </div>
    );
  }

  return (
    <div className="pb-8 max-w-[640px] md:max-w-[720px] lg:max-w-[1100px] mx-auto">
      <ScreenHeader
        action={
          <button
            type="button"
            onClick={() => window.print()}
            aria-label={t("menuView.printAria")}
            title={t("menuView.printAria")}
            className="rounded-full flex items-center justify-center"
            style={{ width: 36, height: 36, background: "var(--color-surface)" }}
          >
            🖨️
          </button>
        }
      />
      <div className="px-4 pt-2 pb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-accent-gold-text)" }}>
          {t("menuView.eyebrow")}
        </p>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
          {payload.barName}
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
        {rows.map(({ item, cocktail }) => (
          <MenuCocktailCard key={item.cocktailId} cocktail={cocktail} price={item.price} ingredientNameById={ingredientNameById} />
        ))}
      </div>
      <p className="text-center text-xs mt-6" style={{ color: "var(--color-text-secondary)" }}>
        {t("menuView.footerNote")}
      </p>
    </div>
  );
}
