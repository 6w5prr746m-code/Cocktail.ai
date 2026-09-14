import type { Cocktail } from "./types";

// Heuristique de "profil de goût" façon carte de bar — dérivée des
// catégories d'ingrédients réellement présentes dans la recette plutôt que
// d'un champ dédié (le modèle de données n'en a pas, comme documenté pour
// la "couleur" dans le README iOS Sprint 6). Volontairement simple et
// explicable : pas de génération de texte, juste des règles lisibles.
const PRIORITY = ["Sans alcool", "Pétillant", "Frais", "Acidulé", "Fruité", "Sucré", "Amer", "Corsé", "Réconfortant"] as const;

export function tasteProfile(cocktail: Cocktail): string[] {
  const tags = new Set<string>();
  const hasCategory = (pred: (cat: string) => boolean) =>
    cocktail.ingredients.some((l) => {
      // catégorie résolue via le nom du lien (les slugs seed encodent la nature de l'ingrédient)
      return pred(l.ingredientId);
    });

  if (cocktail.category.toLowerCase() === "sans alcool") tags.add("Sans alcool");

  if (hasCategory((id) => id.includes("gazeuse") || id.includes("prosecco") || id.includes("champagne") || id.includes("ginger_ale") || id.includes("coca")))
    tags.add("Pétillant");

  if (hasCategory((id) => id.includes("menthe"))) tags.add("Frais");

  if (hasCategory((id) => id.includes("ananas") || id.includes("mure") || id.includes("mangue"))) tags.add("Fruité");

  if (hasCategory((id) => id.includes("citron"))) tags.add("Acidulé");

  if (hasCategory((id) => id.includes("sucre") || id.includes("sirop") || id.includes("miel") || id.includes("grenadine") || id.includes("coco"))) {
    tags.add("Sucré");
  }

  if (hasCategory((id) => id.includes("angostura") || id.includes("aperol") || id.includes("cafe") || id.includes("espresso"))) tags.add("Amer");

  const spiritCl = cocktail.ingredients
    .filter((l) => l.role === "primarySpirit" || l.role === "secondarySpirit")
    .reduce((sum, l) => sum + (l.unit === "cl" ? l.quantity : 0), 0);
  if (spiritCl >= 7) tags.add("Corsé");

  if (cocktail.category.toLowerCase() === "hiver") tags.add("Réconfortant");

  return PRIORITY.filter((tag) => tags.has(tag)).slice(0, 3);
}
