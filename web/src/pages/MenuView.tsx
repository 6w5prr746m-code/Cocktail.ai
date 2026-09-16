import { useMemo, useState } from "react";
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

const DEFAULT_ITEMS_PER_PAGE = 4;

function chunk<T>(arr: T[], size: number): T[][] {
  const step = Math.max(1, size);
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += step) out.push(arr.slice(i, i + step));
  return out;
}

function gridColsClass(n: 1 | 2 | 3): string {
  return n === 1 ? "grid-cols-1" : n === 2 ? "grid-cols-2" : "grid-cols-3";
}

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
          <h2 className="text-xl font-bold text-white leading-tight break-words">{cocktail.name}</h2>
          {price !== null && <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(price)}</p>}
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

/** Version compacte (grilles à 3 colonnes, cocktails non mis en avant) — photo carrée, nom + prix en surimpression, pas d'ingrédients. */
function MenuCocktailCardCompact({ cocktail, price }: { cocktail: Cocktail; price: number | null }) {
  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      className="block rounded-2xl overflow-hidden glass-card animate-fade-in transition-transform active:scale-[0.98]"
    >
      <div className="relative" style={{ aspectRatio: "1 / 1" }}>
        <CocktailVisual cocktail={cocktail} glassSize={44} variant="thumb" lazy />
        <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.85))" }} />
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-sm font-bold text-white truncate">{cocktail.name}</p>
          {price !== null && <p className="text-xs font-semibold text-white/90">{formatCurrency(price)}</p>}
        </div>
      </div>
    </Link>
  );
}

interface MenuRow {
  item: MenuItem;
  cocktail: Cocktail;
}

function PagesLayout({ rows, itemsPerPage, ingredientNameById }: { rows: MenuRow[]; itemsPerPage: number; ingredientNameById: Map<string, string> }) {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);
  const pages = useMemo(() => chunk(rows, itemsPerPage), [rows, itemsPerPage]);
  const total = pages.length;
  const cols: 1 | 2 | 3 = itemsPerPage === 1 ? 1 : itemsPerPage <= 4 ? 2 : 3;

  return (
    <>
      {total > 1 && (
        <div className="menu-pagination-controls flex items-center justify-center gap-4 px-4 mb-4">
          <button
            type="button"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            aria-label={t("menuView.previousPageAria")}
            className="rounded-full flex items-center justify-center text-lg font-semibold"
            style={{ width: 36, height: 36, background: "var(--color-surface)", color: "var(--color-text-primary)", opacity: pageIndex === 0 ? 0.4 : 1 }}
          >
            ←
          </button>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            {t("menuView.pageIndicator", { current: pageIndex + 1, total })}
          </span>
          <button
            type="button"
            disabled={pageIndex === total - 1}
            onClick={() => setPageIndex((p) => Math.min(total - 1, p + 1))}
            aria-label={t("menuView.nextPageAria")}
            className="rounded-full flex items-center justify-center text-lg font-semibold"
            style={{ width: 36, height: 36, background: "var(--color-surface)", color: "var(--color-text-primary)", opacity: pageIndex === total - 1 ? 0.4 : 1 }}
          >
            →
          </button>
        </div>
      )}
      {pages.map((pageRows, i) => (
        <div key={i} className={`menu-page px-4 ${i === pageIndex ? "" : "hidden"}`}>
          {itemsPerPage === 1 ? (
            <div className="flex flex-col gap-4">
              {pageRows.map(({ item, cocktail }) => (
                <MenuCocktailCard key={item.cocktailId} cocktail={cocktail} price={item.price} ingredientNameById={ingredientNameById} />
              ))}
            </div>
          ) : (
            <div className={`grid ${gridColsClass(cols)} gap-4`}>
              {pageRows.map(({ item, cocktail }) => (
                <MenuCocktailCardCompact key={item.cocktailId} cocktail={cocktail} price={item.price} />
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function FeaturedLayout({ rows, ingredientNameById }: { rows: MenuRow[]; ingredientNameById: Map<string, string> }) {
  const marked = rows.filter((r) => r.item.featured);
  // Si personne n'a été marqué ★, le premier cocktail sert de mise en avant
  // plutôt que d'afficher une grille compacte uniforme peu premium.
  const featured = marked.length > 0 ? marked : rows.slice(0, 1);
  const rest = marked.length > 0 ? rows.filter((r) => !r.item.featured) : rows.slice(1);

  return (
    <div className="px-4 flex flex-col gap-4">
      {featured.map(({ item, cocktail }) => (
        <MenuCocktailCard key={item.cocktailId} cocktail={cocktail} price={item.price} ingredientNameById={ingredientNameById} />
      ))}
      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-1">
          {rest.map(({ item, cocktail }) => (
            <MenuCocktailCardCompact key={item.cocktailId} cocktail={cocktail} price={item.price} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MenuViewPage() {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const cocktails = useAllCocktails();
  const ingredients = useLocalizedIngredients(useAllIngredients());
  const ingredientNameById = useMemo(() => new Map(ingredients.map((i) => [i.id, i.name])), [ingredients]);

  const payload = useMemo(() => (code ? decodeMenu(code) : null), [code]);

  const rows = useMemo<MenuRow[]>(() => {
    if (!payload) return [];
    return payload.items
      .map((item) => ({ item, cocktail: cocktails.find((c) => c.id === item.cocktailId) }))
      .filter((row): row is MenuRow => Boolean(row.cocktail));
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

  const maxWidth =
    payload.layout === "grid3" || payload.layout === "featured"
      ? "max-w-[640px] md:max-w-[900px] lg:max-w-[1200px]"
      : payload.layout === "grid2"
        ? "max-w-[640px] md:max-w-[820px]"
        : "max-w-[640px]";

  return (
    <div className={`pb-8 mx-auto ${maxWidth}`}>
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

      {payload.layout === "list" && (
        <div className="flex flex-col gap-4 px-4">
          {rows.map(({ item, cocktail }) => (
            <MenuCocktailCard key={item.cocktailId} cocktail={cocktail} price={item.price} ingredientNameById={ingredientNameById} />
          ))}
        </div>
      )}
      {payload.layout === "grid2" && (
        <div className="grid grid-cols-2 gap-4 px-4">
          {rows.map(({ item, cocktail }) => (
            <MenuCocktailCard key={item.cocktailId} cocktail={cocktail} price={item.price} ingredientNameById={ingredientNameById} />
          ))}
        </div>
      )}
      {payload.layout === "grid3" && (
        <div className="grid grid-cols-3 gap-3 px-4">
          {rows.map(({ item, cocktail }) => (
            <MenuCocktailCardCompact key={item.cocktailId} cocktail={cocktail} price={item.price} />
          ))}
        </div>
      )}
      {payload.layout === "pages" && (
        <PagesLayout rows={rows} itemsPerPage={payload.itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE} ingredientNameById={ingredientNameById} />
      )}
      {payload.layout === "featured" && <FeaturedLayout rows={rows} ingredientNameById={ingredientNameById} />}

      <p className="text-center text-xs mt-6" style={{ color: "var(--color-text-secondary)" }}>
        {t("menuView.footerNote")}
      </p>
    </div>
  );
}
