// BASE_URL vaut "/" en dev et reflète le --base passé au build en prod (ex:
// "/Cocktail.ai/" sur GitHub Pages, voir main.tsx) — un lien externe
// (partage de recette, carte de cocktails, QR code) doit l'inclure
// explicitement : window.location.origin seul ne suffit pas sur un site de
// projet GitHub Pages, qui vit sous un sous-chemin plutôt qu'à la racine.
export function buildAppUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}${path}`;
}
