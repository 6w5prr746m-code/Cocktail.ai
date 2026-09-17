import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { CocktailVisual } from "../components/CocktailVisual";
import { TasteTags } from "../components/TasteTags";
import { useAllCocktails, useAllIngredients } from "../domain/catalog";
import { decodeMenu, type MenuItem, type MenuPayload, type MenuStory } from "../domain/menuShareCode";
import { MENU_THEMES } from "../domain/menuThemes";
import { formatCurrency } from "../domain/formatting";
import { tasteProfile } from "../domain/tasteProfile";
import { useTranslation } from "../domain/i18n/useTranslation";
import { useLocalizedIngredients } from "../domain/i18n/useLocalizedCocktail";
import { getLocalizedTasteTags } from "../domain/i18n/localizedCocktail";
import type { Cocktail } from "../domain/types";

const DEFAULT_ITEMS_PER_PAGE = 4;

/** Dimensions physiques (mm) du format papier choisi dans MenuBuilder.tsx — voir PrintBooklet. */
const PRINT_PAGE_SIZE_MM: Record<"a5" | "a4", { width: number; height: number }> = {
  a5: { width: 148, height: 210 },
  a4: { width: 210, height: 297 },
};

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

/** Une "page" du carnet : couverture, histoire, cocktails (1 ou plusieurs selon la mise en page) et dos — toutes naviguées/imprimées de façon uniforme par le composant principal. */
function buildCocktailPages(payload: MenuPayload, rows: MenuRow[], ingredientNameById: Map<string, string>): ReactNode[] {
  if (payload.layout === "grid3") {
    return [
      <div key="cocktails" className="grid grid-cols-3 gap-3 px-4">
        {rows.map(({ item, cocktail }) => (
          <MenuCocktailCardCompact key={item.cocktailId} cocktail={cocktail} price={item.price} />
        ))}
      </div>,
    ];
  }

  if (payload.layout === "grid2") {
    return [
      <div key="cocktails" className="grid grid-cols-2 gap-4 px-4">
        {rows.map(({ item, cocktail }) => (
          <MenuCocktailCard key={item.cocktailId} cocktail={cocktail} price={item.price} ingredientNameById={ingredientNameById} />
        ))}
      </div>,
    ];
  }

  if (payload.layout === "featured") {
    const marked = rows.filter((r) => r.item.featured);
    // Si personne n'a été marqué ★, le premier cocktail sert de mise en avant
    // plutôt que d'afficher une grille compacte uniforme peu premium.
    const featured = marked.length > 0 ? marked : rows.slice(0, 1);
    const rest = marked.length > 0 ? rows.filter((r) => !r.item.featured) : rows.slice(1);
    return [
      <div key="cocktails" className="px-4 flex flex-col gap-4">
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
      </div>,
    ];
  }

  if (payload.layout === "pages") {
    const itemsPerPage = payload.itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE;
    const cols: 1 | 2 | 3 = itemsPerPage === 1 ? 1 : itemsPerPage <= 4 ? 2 : 3;
    return chunk(rows, itemsPerPage).map((pageRows, i) =>
      itemsPerPage === 1 ? (
        <div key={i} className="flex flex-col gap-4 px-4">
          {pageRows.map(({ item, cocktail }) => (
            <MenuCocktailCard key={item.cocktailId} cocktail={cocktail} price={item.price} ingredientNameById={ingredientNameById} />
          ))}
        </div>
      ) : (
        <div key={i} className={`grid ${gridColsClass(cols)} gap-4 px-4`}>
          {pageRows.map(({ item, cocktail }) => (
            <MenuCocktailCardCompact key={item.cocktailId} cocktail={cocktail} price={item.price} />
          ))}
        </div>
      ),
    );
  }

  // "list" (défaut)
  return [
    <div key="cocktails" className="flex flex-col gap-4 px-4">
      {rows.map(({ item, cocktail }) => (
        <MenuCocktailCard key={item.cocktailId} cocktail={cocktail} price={item.price} ingredientNameById={ingredientNameById} />
      ))}
    </div>,
  ];
}

function CoverPage({ payload }: { payload: MenuPayload }) {
  const { t } = useTranslation();
  const themeStyle = MENU_THEMES[payload.theme ?? "classic"];
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-16"
      style={{ minHeight: "70vh", background: themeStyle.coverBackground }}
    >
      {payload.logo && (
        <div className="rounded-2xl overflow-hidden mb-6 flex items-center justify-center" style={{ width: 140, height: 140, background: "#ffffff" }}>
          <img src={payload.logo} alt={payload.barName} className="w-full h-full object-contain p-3" />
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: themeStyle.onCoverText, opacity: 0.8 }}>
        {t("menuView.eyebrow")}
      </p>
      <h1 className="text-4xl font-bold" style={{ color: themeStyle.onCoverText, fontFamily: themeStyle.fontFamily }}>
        {payload.barName}
      </h1>
    </div>
  );
}

function StoryPage({ story, theme }: { story: MenuStory; theme: MenuPayload["theme"] }) {
  const { t } = useTranslation();
  const themeStyle = MENU_THEMES[theme ?? "classic"];
  return (
    <div className="px-6 py-14 flex flex-col items-center text-center gap-5" style={{ minHeight: "70vh" }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: themeStyle.accentColor }}>
        {t("menuView.storyEyebrow")}
      </p>
      {story.image && (
        <img src={story.image} alt="" className="rounded-2xl object-cover" style={{ maxWidth: 280, maxHeight: 280 }} />
      )}
      {story.text && (
        <p className="text-sm leading-relaxed max-w-[420px]" style={{ color: "var(--color-text-secondary)" }}>
          {story.text}
        </p>
      )}
    </div>
  );
}

function BackCoverWhite({ payload }: { payload: MenuPayload }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "70vh", background: "#ffffff" }}>
      {payload.logo ? (
        <img src={payload.logo} alt={payload.barName} style={{ maxWidth: 160, maxHeight: 160, objectFit: "contain" }} />
      ) : (
        <p className="text-2xl font-bold" style={{ color: "#0b0b0f" }}>
          {payload.barName}
        </p>
      )}
    </div>
  );
}

function BackCoverBlack({ payload }: { payload: MenuPayload }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6" style={{ minHeight: "70vh", background: "#0b0b0b" }}>
      {payload.logo && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
          <img src={payload.logo} alt="" style={{ maxWidth: 100, maxHeight: 100, objectFit: "contain" }} />
        </div>
      )}
      <p
        className="text-2xl font-bold tracking-wide text-center"
        style={{
          background: "linear-gradient(135deg, #f2f2f2 0%, #a8a8a8 45%, #f2f2f2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontFamily: "var(--font-display)",
        }}
      >
        {payload.barName}
      </p>
    </div>
  );
}

/**
 * Rendu dédié à l'impression — complètement distinct du rendu écran
 * (`.print-booklet`, masqué à l'écran et seul visible à l'impression, voir
 * index.css). Les mises en page grille/photo (`MenuLayout`) sont pensées
 * pour naviguer au doigt sur mobile ; sur papier on veut une vraie carte de
 * bar (liste typographique, nom/prix reliés par un pointillé, ingrédients
 * en petit italique) quel que soit le `layout` choisi pour l'écran — les
 * deux rendus partagent les données (`rows`) mais pas la mise en page.
 * Couverture/histoire/dos gardent une hauteur de page fixe (contenu court
 * et maîtrisé) ; la liste des cocktails n'a pas de hauteur fixée et
 * s'étale naturellement sur autant de feuillets que nécessaire — c'est la
 * pagination native du navigateur (@page + break-after) qui découpe le
 * flux, plutôt qu'un calcul manuel du nombre de cocktails par page.
 */
function PrintCover({ payload }: { payload: MenuPayload }) {
  const { t } = useTranslation();
  const themeStyle = MENU_THEMES[payload.theme ?? "classic"];
  return (
    <div className="print-page print-page-fixed print-cover" style={{ background: themeStyle.coverBackground }}>
      {payload.logo && (
        <div className="print-cover-logo">
          <img src={payload.logo} alt={payload.barName} />
        </div>
      )}
      <p className="print-eyebrow" style={{ color: themeStyle.onCoverText }}>
        {t("menuView.eyebrow")}
      </p>
      <h1 className="print-cover-title" style={{ color: themeStyle.onCoverText, fontFamily: themeStyle.fontFamily }}>
        {payload.barName}
      </h1>
      <div className="print-cover-rule" style={{ background: themeStyle.onCoverText }} />
    </div>
  );
}

function PrintStory({ story, theme }: { story: MenuStory; theme: MenuPayload["theme"] }) {
  const { t } = useTranslation();
  const themeStyle = MENU_THEMES[theme ?? "classic"];
  return (
    <div className="print-page print-page-fixed print-story">
      <p className="print-eyebrow" style={{ color: themeStyle.accentColor }}>
        {t("menuView.storyEyebrow")}
      </p>
      {story.image && (
        <div className="print-story-image">
          <img src={story.image} alt="" />
        </div>
      )}
      {story.text && <p className="print-story-text">{story.text}</p>}
    </div>
  );
}

function PrintCocktailList({ payload, rows, ingredientNameById }: { payload: MenuPayload; rows: MenuRow[]; ingredientNameById: Map<string, string> }) {
  const { t } = useTranslation();
  const themeStyle = MENU_THEMES[payload.theme ?? "classic"];
  return (
    <div className="print-page print-cocktails">
      <div className="print-cocktails-header">
        <p className="print-cocktails-barname">{payload.barName}</p>
        <p className="print-cocktails-eyebrow" style={{ color: themeStyle.accentColor }}>
          {t("menuView.eyebrow")}
        </p>
      </div>
      <div className="print-cocktails-rule" style={{ background: themeStyle.accentColor }} />
      <ul className="print-cocktails-list">
        {rows.map(({ item, cocktail }) => {
          const ingredientNames = cocktail.ingredients.map((link) => ingredientNameById.get(link.ingredientId) ?? link.ingredientId);
          return (
            <li key={item.cocktailId} className="print-item">
              <div className="print-item-row">
                <span className="print-item-name">{cocktail.name}</span>
                <span className="print-item-leader" />
                {item.price !== null && <span className="print-item-price">{formatCurrency(item.price)}</span>}
              </div>
              {ingredientNames.length > 0 && <p className="print-item-ingredients">{ingredientNames.join(" · ")}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PrintBackWhite({ payload }: { payload: MenuPayload }) {
  return (
    <div className="print-page print-page-fixed print-back-white">
      {payload.logo ? <img src={payload.logo} alt={payload.barName} className="print-back-logo" /> : <p className="print-back-name">{payload.barName}</p>}
    </div>
  );
}

function PrintBackBlack({ payload }: { payload: MenuPayload }) {
  return (
    <div className="print-page print-page-fixed print-back-black">
      {payload.logo && (
        <div className="print-back-black-logo">
          <img src={payload.logo} alt="" />
        </div>
      )}
      <p className="print-back-black-name">{payload.barName}</p>
    </div>
  );
}

function PrintBooklet({ payload, rows, ingredientNameById }: { payload: MenuPayload; rows: MenuRow[]; ingredientNameById: Map<string, string> }) {
  const size = PRINT_PAGE_SIZE_MM[payload.printFormat ?? "a5"];
  // Portalé directement sous <body>, hors de <main id="main-content"
  // class="overflow-y-auto"> (AppShell, App.tsx) : un contenu plus grand
  // qu'un feuillet à l'intérieur d'un ancêtre scrollable se fait tronquer
  // par le pipeline d'impression/PDF de Chromium (seul ce qui tient dans
  // un "viewport" ressort, le reste du flux "break-after: page" est
  // silencieusement perdu) — vérifié en inspectant le PDF réellement
  // généré, pas seulement l'aperçu à l'écran sous emulateMedia("print").
  return createPortal(
    <div className="print-booklet">
      {/* @page ne lit pas les variables CSS de façon fiable sur tous les
          moteurs — on génère donc la règle avec les dimensions mm déjà
          résolues plutôt que de la conditionner à @media print, certains
          moteurs de rendu PDF/impression ignorant une règle @page imbriquée
          dans un bloc @media (elle ne s'applique de toute façon qu'au
          moment de l'impression). */}
      <style>{`
        @page { size: ${size.width}mm ${size.height}mm; margin: 0; }
        .print-page-fixed { height: ${size.height}mm; }
        .print-page { width: ${size.width}mm; }
      `}</style>
      {payload.logo && <PrintCover payload={payload} />}
      {payload.story && <PrintStory story={payload.story} theme={payload.theme} />}
      <PrintCocktailList payload={payload} rows={rows} ingredientNameById={ingredientNameById} />
      {payload.logo && (
        <>
          <PrintBackWhite payload={payload} />
          <PrintBackBlack payload={payload} />
        </>
      )}
    </div>,
    document.body,
  );
}

export default function MenuViewPage() {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const cocktails = useAllCocktails();
  const ingredients = useLocalizedIngredients(useAllIngredients());
  const ingredientNameById = useMemo(() => new Map(ingredients.map((i) => [i.id, i.name])), [ingredients]);
  const [pageIndex, setPageIndex] = useState(0);

  const payload = useMemo(() => (code ? decodeMenu(code) : null), [code]);

  const rows = useMemo<MenuRow[]>(() => {
    if (!payload) return [];
    return payload.items
      .map((item) => ({ item, cocktail: cocktails.find((c) => c.id === item.cocktailId) }))
      .filter((row): row is MenuRow => Boolean(row.cocktail));
  }, [payload, cocktails]);

  const pages = useMemo<ReactNode[]>(() => {
    if (!payload) return [];
    const list: ReactNode[] = [];
    if (payload.logo) list.push(<CoverPage key="cover" payload={payload} />);
    if (payload.story) list.push(<StoryPage key="story" story={payload.story} theme={payload.theme} />);
    list.push(...buildCocktailPages(payload, rows, ingredientNameById));
    if (payload.logo) {
      list.push(<BackCoverWhite key="back-white" payload={payload} />);
      list.push(<BackCoverBlack key="back-black" payload={payload} />);
    }
    return list;
  }, [payload, rows, ingredientNameById]);

  useEffect(() => {
    setPageIndex(0);
  }, [code]);

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

  const safePageIndex = Math.min(pageIndex, pages.length - 1);

  return (
    <>
    <PrintBooklet payload={payload} rows={rows} ingredientNameById={ingredientNameById} />
    <div className={`screen-only pb-8 mx-auto ${maxWidth}`}>
      <ScreenHeader
        action={
          <button
            type="button"
            onClick={() => window.print()}
            aria-label={t("menuView.printAria")}
            title={t("menuView.printAria")}
            className="rounded-full flex items-center justify-center"
            style={{ width: 36, height: 36, background: "var(--color-surface)", color: "var(--color-text-primary)" }}
          >
            <Printer size={17} strokeWidth={1.75} aria-hidden />
          </button>
        }
      />

      {!payload.logo && (
        <div className="px-4 pt-2 pb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-accent-gold-text)" }}>
            {t("menuView.eyebrow")}
          </p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
            {payload.barName}
          </h1>
        </div>
      )}

      {pages.length > 1 && (
        <div className="menu-pagination-controls flex items-center justify-center gap-4 px-4 mb-4">
          <button
            type="button"
            disabled={safePageIndex === 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            aria-label={t("menuView.previousPageAria")}
            className="rounded-full flex items-center justify-center text-lg font-semibold"
            style={{ width: 36, height: 36, background: "var(--color-surface)", color: "var(--color-text-primary)", opacity: safePageIndex === 0 ? 0.4 : 1 }}
          >
            <ChevronLeft size={20} strokeWidth={2.25} aria-hidden />
          </button>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            {t("menuView.pageIndicator", { current: safePageIndex + 1, total: pages.length })}
          </span>
          <button
            type="button"
            disabled={safePageIndex === pages.length - 1}
            onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))}
            aria-label={t("menuView.nextPageAria")}
            className="rounded-full flex items-center justify-center text-lg font-semibold"
            style={{
              width: 36,
              height: 36,
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
              opacity: safePageIndex === pages.length - 1 ? 0.4 : 1,
            }}
          >
            <ChevronRight size={20} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      )}

      {pages.map((page, i) => (
        <div key={i} className={`menu-page ${i === safePageIndex ? "" : "hidden"}`}>
          {page}
        </div>
      ))}

      <p className="text-center text-xs mt-6" style={{ color: "var(--color-text-secondary)" }}>
        {t("menuView.footerNote")}
      </p>
    </div>
    </>
  );
}
