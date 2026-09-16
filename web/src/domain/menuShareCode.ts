import { base64UrlDecode, base64UrlEncode } from "./base64Url";

export interface MenuItem {
  cocktailId: string;
  price: number | null;
}

export interface MenuPayload {
  barName: string;
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

function isValidPayload(value: unknown): value is MenuPayload {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  if (typeof p.barName !== "string" || p.barName.length === 0 || p.barName.length > MAX_NAME_LENGTH) return false;
  if (!Array.isArray(p.items) || p.items.length === 0 || p.items.length > MAX_ITEMS) return false;
  return p.items.every((i) => i && typeof i === "object" && typeof (i as MenuItem).cocktailId === "string");
}

/** Décode un lien de carte partagée. Retourne `null` pour tout code manquant, corrompu, ou ne respectant pas la forme attendue — jamais d'exception, c'est du contenu potentiellement forgé arrivant par URL. */
export function decodeMenu(code: string): MenuPayload | null {
  try {
    const json = new TextDecoder().decode(base64UrlDecode(code));
    const parsed: unknown = JSON.parse(json);
    return isValidPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
