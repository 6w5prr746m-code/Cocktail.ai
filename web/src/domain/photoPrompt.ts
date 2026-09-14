import type { Cocktail } from "./types";
import { artFor, type GarnishIcon, type GlassShape, type IceKind } from "./glassArt";

// Bloc de style commun à tous les prompts de photo — garantit que chaque
// nouvelle photo (généraliste ou recette perso) ressemble au même
// "shooting" que les premières validées (Mojito/Margarita/Espresso
// Martini) : même surface, même lumière, même cadrage.
export const PHOTO_STYLE_BLOCK =
  "Professional editorial cocktail photography, shot on a dark charcoal slate surface, moody cinematic lighting with warm golden rim light coming from the upper left, deep black background softly fading to warm amber in the corners, shallow depth of field, subtle condensation droplets on the glass, photorealistic, high-end bar magazine aesthetic, 85mm lens look, square 1:1 composition, glass perfectly centered, no text, no hands, no people, no extra glasses in frame.";

const GLASS_LABEL: Record<GlassShape, string> = {
  highball: "a tall highball glass",
  coupe: "a classic V-shaped coupe glass",
  rocks: "a short rocks / old fashioned glass",
  hurricane: "a curvy hurricane glass",
  wine: "a wine glass",
  mug: "a footed heatproof mug with a handle",
  margarita: "a wide-rimmed margarita glass",
};

const GARNISH_LABEL: Record<GarnishIcon, string | null> = {
  mint: "a fresh mint sprig garnish",
  citrusWheel: "a citrus wheel garnish resting on the rim",
  citrusTwist: "a citrus twist garnish",
  cherry: "a maraschino cherry garnish",
  pineapple: "a pineapple wedge garnish",
  cinnamon: "a cinnamon stick garnish",
  saltRim: "a full coarse-salt rim crusted around the glass edge",
  olive: "a green olive garnish on a small pick",
  coffeeBeans: "exactly three whole coffee beans floating on top",
  berries: "a few fresh blackberries as garnish",
  none: null,
};

const ICE_LABEL: Record<IceKind, string> = {
  cubes: "served over ice cubes",
  crushed: "served over crushed ice",
  none: "no ice, served straight up",
};

// Description anglaise du liquide, curatée à la main pour les 14 cocktails
// du seed — même esprit que la palette de GlassArt (glassArt.ts) mais
// formulée pour un prompt de génération d'image plutôt qu'un remplissage
// SVG. Une recette perso sans entrée ici retombe sur une description
// approximative dérivée de la couleur curatée (voir plus bas).
const LIQUID_DESCRIPTION: Record<string, string> = {
  mojito: "a pale green-tinted rum cocktail",
  cuba_libre: "a dark cola-brown rum cocktail",
  daiquiri: "a pale straw-yellow cocktail",
  old_cuban: "an amber-pink sparkling cocktail",
  virgin_mojito: "a pale green non-alcoholic cocktail",
  pina_colada: "a creamy pale yellow tropical cocktail",
  mai_tai: "a deep orange-amber tiki cocktail",
  whiskey_sour: "an amber-gold whiskey cocktail with a frothy white top",
  aperol_spritz: "a bright orange sparkling spritz",
  espresso_martini: "a dark rich coffee-brown cocktail with a thick creamy light-caramel foam on top",
  hot_toddy: "a warm amber whiskey drink",
  margarita: "a pale chartreuse-green cocktail",
  bramble: "a purple-red cocktail with a darker berry drizzle",
  shirley_temple: "a bright red-pink non-alcoholic soda drink",
};

/** Approximation grossière (teinte/luminosité) pour une recette perso sans description curatée. */
function approximateLiquidDescription(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const shade = lightness > 0.8 ? "pale " : lightness < 0.3 ? "dark " : "";
  let hueName = "amber";
  if (hue < 20 || hue >= 340) hueName = "red";
  else if (hue < 50) hueName = "orange-amber";
  else if (hue < 70) hueName = "golden-yellow";
  else if (hue < 160) hueName = "green";
  else if (hue < 200) hueName = "teal";
  else if (hue < 250) hueName = "blue";
  else if (hue < 300) hueName = "purple";
  else hueName = "pink";

  return `a ${shade}${hueName} cocktail`;
}

/** Génère un prompt de photo prêt à coller dans Gemini/Imagen pour n'importe quel cocktail du catalogue (seed ou recette perso). */
export function buildPhotoPrompt(cocktail: Cocktail): string {
  const art = artFor(cocktail);
  const glass = GLASS_LABEL[art.shape];
  const ice = ICE_LABEL[art.ice];
  const garnish = GARNISH_LABEL[art.garnish];
  const liquid = LIQUID_DESCRIPTION[cocktail.id] ?? approximateLiquidDescription(art.liquidColor);
  const steam = art.hot ? ", a light wisp of steam rising" : "";
  const article = /^[aeiouâéèêAEIOUÂÉÈÊ]/.test(cocktail.name) ? "An" : "A";

  const sentence = [`${article} ${cocktail.name} in ${glass}`, liquid, ice, garnish].filter(Boolean).join(", ") + steam + ".";

  return `${PHOTO_STYLE_BLOCK}\n\n${sentence}`;
}
