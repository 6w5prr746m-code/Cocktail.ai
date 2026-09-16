import { base64UrlDecode, base64UrlEncode } from "./base64Url";
import { MENU_THEME_IDS, type MenuTheme } from "./menuThemes";

export type { MenuTheme };

// "list"/"grid2"/"grid3" : une seule page, 1/2/3 colonnes. "pages" : les
// cocktails sont répartis sur plusieurs pages navigables (itemsPerPage par
// page — 1 revient à "une page par cocktail"). "featured" : les cocktails
// marqués featured s'affichent en grand, le reste en grille compacte.
export type MenuLayout = "list" | "grid2" | "grid3" | "pages" | "featured";

export const MENU_LAYOUTS: MenuLayout[] = ["list", "grid2", "grid3", "pages", "featured"];

export interface MenuItem {
  cocktailId: string;
  price: number | null;
  /** Pertinent uniquement pour layout "featured" : affiché en grande carte plutôt que dans la grille compacte. */
  featured?: boolean;
}

export interface MenuStory {
  text?: string;
  /** Data URI (image compressée côté client, voir imageCompression.ts). */
  image?: string;
}

export interface MenuPayload {
  barName: string;
  layout: MenuLayout;
  /** Pertinent uniquement pour layout "pages" — nombre de cocktails par page. */
  itemsPerPage?: number;
  items: MenuItem[];
  /** Habillage visuel des pages de couverture/histoire/dos — voir menuThemes.ts. */
  theme?: MenuTheme;
  /** Data URI (image compressée côté client). Sa présence déclenche l'affichage des pages de couverture et de dos — voir MenuView.tsx. */
  logo?: string;
  story?: MenuStory;
}

const MAX_ITEMS = 60;
const MAX_NAME_LENGTH = 80;
const MAX_STORY_TEXT_LENGTH = 2000;
// Une image compressée (voir imageCompression.ts) tient largement sous cette
// limite ; elle protège surtout contre un payload forgé à la main plutôt
// que contre un usage normal (le vrai garde-fou est l'indicateur de taille
// en temps réel dans MenuBuilder.tsx, qui vise à rester scannable en QR).
const MAX_IMAGE_DATA_URI_LENGTH = 60000;

// Une carte ne référence que des cocktails du catalogue (jamais une recette
// perso) : le catalogue est bundlé dans l'app, donc le lien reste
// résoluble sur n'importe quel appareil qui scanne le QR code, sans
// backend. Une recette perso ne vivant que dans le localStorage de son
// créateur n'aurait pas ce même caractère auto-porteur à l'échelle d'une
// carte entière (voir recipeShareCode.ts pour le cas d'une recette seule).
export function encodeMenu(payload: MenuPayload): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
}

interface RawMenuPayload {
  barName: string;
  items: { cocktailId: string; price?: unknown; featured?: unknown }[];
  layout?: unknown;
  itemsPerPage?: unknown;
  theme?: unknown;
  logo?: unknown;
  story?: { text?: unknown; image?: unknown } | unknown;
}

function isValidImageDataUri(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_IMAGE_DATA_URI_LENGTH && value.startsWith("data:image/");
}

function isValidRawPayload(value: unknown): value is RawMenuPayload {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  if (typeof p.barName !== "string" || p.barName.length === 0 || p.barName.length > MAX_NAME_LENGTH) return false;
  if (!Array.isArray(p.items) || p.items.length === 0 || p.items.length > MAX_ITEMS) return false;
  return p.items.every((i) => i && typeof i === "object" && typeof (i as { cocktailId: unknown }).cocktailId === "string");
}

/**
 * Décode un lien de carte partagée. Retourne `null` pour tout code
 * manquant, corrompu, ou ne respectant pas la forme attendue — jamais
 * d'exception, c'est du contenu potentiellement forgé arrivant par URL.
 * `layout`/`itemsPerPage`/`featured` sont normalisés avec des valeurs par
 * défaut sûres : un lien généré avant l'ajout des mises en page reste
 * décodable (repli sur "list").
 */
export function decodeMenu(code: string): MenuPayload | null {
  try {
    const json = new TextDecoder().decode(base64UrlDecode(code));
    const parsed: unknown = JSON.parse(json);
    if (!isValidRawPayload(parsed)) return null;

    const layout = MENU_LAYOUTS.includes(parsed.layout as MenuLayout) ? (parsed.layout as MenuLayout) : "list";
    const itemsPerPage =
      typeof parsed.itemsPerPage === "number" && Number.isFinite(parsed.itemsPerPage) && parsed.itemsPerPage >= 1
        ? Math.floor(parsed.itemsPerPage)
        : undefined;
    const theme = MENU_THEME_IDS.includes(parsed.theme as MenuTheme) ? (parsed.theme as MenuTheme) : "classic";
    const logo = isValidImageDataUri(parsed.logo) ? parsed.logo : undefined;

    let story: MenuStory | undefined;
    if (parsed.story && typeof parsed.story === "object") {
      const rawStory = parsed.story as { text?: unknown; image?: unknown };
      const text = typeof rawStory.text === "string" && rawStory.text.length > 0 ? rawStory.text.slice(0, MAX_STORY_TEXT_LENGTH) : undefined;
      const image = isValidImageDataUri(rawStory.image) ? rawStory.image : undefined;
      if (text || image) story = { text, image };
    }

    return {
      barName: parsed.barName,
      layout,
      itemsPerPage,
      theme,
      logo,
      story,
      items: parsed.items.map((i) => ({
        cocktailId: i.cocktailId,
        price: typeof i.price === "number" && Number.isFinite(i.price) ? i.price : null,
        featured: Boolean(i.featured),
      })),
    };
  } catch {
    return null;
  }
}
