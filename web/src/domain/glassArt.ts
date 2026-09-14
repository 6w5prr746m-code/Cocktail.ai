import type { Cocktail } from "./types";

export type GlassShape = "highball" | "coupe" | "rocks" | "hurricane" | "wine" | "mug" | "margarita";

export type GarnishIcon =
  | "mint"
  | "citrusWheel"
  | "citrusTwist"
  | "cherry"
  | "pineapple"
  | "cinnamon"
  | "saltRim"
  | "olive"
  | "coffeeBeans"
  | "berries"
  | "none";

export type IceKind = "cubes" | "crushed" | "none";

export interface CocktailArt {
  shape: GlassShape;
  liquidColor: string;
  liquidColorSecondary?: string;
  garnish: GarnishIcon;
  garnishColor?: string;
  ice: IceKind;
  hot?: boolean;
}

// Palette curatée à la main, cocktail par cocktail — la couleur du liquide
// vise la teinte réelle de la boisson (pas le dégradé de marque, qui reste
// utilisé comme fond derrière le verre). C'est le même exercice qu'un
// barman qui dessinerait l'icône de sa carte : verre juste, couleur juste,
// garniture reconnaissable au premier coup d'œil.
const CURATED: Record<string, CocktailArt> = {
  mojito: { shape: "highball", liquidColor: "#cfe0a8", garnish: "mint", ice: "crushed" },
  cuba_libre: { shape: "highball", liquidColor: "#4a2a12", garnish: "citrusWheel", garnishColor: "#8bc34a", ice: "cubes" },
  daiquiri: { shape: "coupe", liquidColor: "#f2e9c9", garnish: "citrusTwist", garnishColor: "#c7d94a", ice: "none" },
  old_cuban: { shape: "coupe", liquidColor: "#c97b4a", garnish: "mint", ice: "none" },
  virgin_mojito: { shape: "highball", liquidColor: "#d9eec0", garnish: "mint", ice: "crushed" },
  pina_colada: { shape: "hurricane", liquidColor: "#f5ebc8", garnish: "pineapple", ice: "crushed" },
  mai_tai: { shape: "rocks", liquidColor: "#d9752e", garnish: "mint", ice: "crushed" },
  whiskey_sour: { shape: "rocks", liquidColor: "#d9a441", garnish: "cherry", ice: "cubes" },
  aperol_spritz: { shape: "wine", liquidColor: "#f4903a", garnish: "citrusWheel", garnishColor: "#f4903a", ice: "cubes" },
  espresso_martini: { shape: "coupe", liquidColor: "#2b1810", garnish: "coffeeBeans", ice: "none" },
  hot_toddy: { shape: "mug", liquidColor: "#b97a2e", garnish: "cinnamon", ice: "none", hot: true },
  margarita: { shape: "margarita", liquidColor: "#e7efa0", garnish: "saltRim", ice: "cubes" },
  bramble: { shape: "rocks", liquidColor: "#8c3a5c", liquidColorSecondary: "#4a1830", garnish: "berries", ice: "crushed" },
  shirley_temple: { shape: "highball", liquidColor: "#e8546a", garnish: "cherry", ice: "cubes" },
};

const CATEGORY_FALLBACK_LIQUID: Record<string, string> = {
  tropical: "#f2a35c",
  tiki: "#e0703a",
  classique: "#d9a441",
  moderne: "#c97b4a",
  "sans alcool": "#e8546a",
  apéritif: "#f4903a",
  hiver: "#b97a2e",
};

function heuristicShape(glassware: string): GlassShape {
  const g = glassware.toLowerCase();
  if (g.includes("highball")) return "highball";
  if (g.includes("hurricane")) return "hurricane";
  if (g.includes("old fashioned") || g.includes("rocks")) return "rocks";
  if (g.includes("vin")) return "wine";
  if (g.includes("margarita")) return "margarita";
  if (g.includes("chaleur") || g.includes("toddy") || g.includes("mug")) return "mug";
  return "coupe";
}

function heuristicGarnish(garnish: string): { icon: GarnishIcon; color?: string } {
  const g = garnish.toLowerCase();
  if (g.includes("menthe")) return { icon: "mint" };
  if (g.includes("mûre") || g.includes("baie")) return { icon: "berries" };
  if (g.includes("ananas")) return { icon: "pineapple" };
  if (g.includes("cannelle")) return { icon: "cinnamon" };
  if (g.includes("sel")) return { icon: "saltRim" };
  if (g.includes("olive")) return { icon: "olive" };
  if (g.includes("café") || g.includes("grain")) return { icon: "coffeeBeans" };
  if (g.includes("cerise")) return { icon: "cherry" };
  if (g.includes("zeste") || g.includes("twist")) return { icon: "citrusTwist", color: "#e0a83a" };
  if (g.includes("citron") || g.includes("orange") || g.includes("rondelle")) return { icon: "citrusWheel", color: "#e0a83a" };
  return { icon: "none" };
}

function heuristicIce(iceType: string): IceKind {
  const i = iceType.toLowerCase();
  if (i.includes("pilée") || i.includes("crushed")) return "crushed";
  if (i.includes("aucune") || i.includes("chaud")) return "none";
  if (i.includes("glaçon") || i.includes("glace")) return "cubes";
  return "none";
}

function heuristicArt(cocktail: Cocktail): CocktailArt {
  const { icon, color } = heuristicGarnish(cocktail.garnish);
  return {
    shape: heuristicShape(cocktail.glassware),
    liquidColor: CATEGORY_FALLBACK_LIQUID[cocktail.category.toLowerCase()] ?? "#d9a441",
    garnish: icon,
    garnishColor: color,
    ice: heuristicIce(cocktail.iceType),
    hot: cocktail.iceType.toLowerCase().includes("chaud"),
  };
}

export function artFor(cocktail: Cocktail): CocktailArt {
  return CURATED[cocktail.id] ?? heuristicArt(cocktail);
}
