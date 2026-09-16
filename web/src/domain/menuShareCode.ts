import { base64UrlDecode, base64UrlEncode } from "./base64Url";

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

export interface MenuPayload {
  barName: string;
  layout: MenuLayout;
  /** Pertinent uniquement pour layout "pages" — nombre de cocktails par page. */
  itemsPerPage?: number;
  items: MenuItem[];
}

const MAX_ITEMS = 60;
const MAX_NAME_LENGTH = 80;

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

    return {
      barName: parsed.barName,
      layout,
      itemsPerPage,
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
