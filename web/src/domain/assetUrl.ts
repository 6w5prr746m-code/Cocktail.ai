// BASE_URL vaut "/" en local et "/<repo>/" en prod GitHub Pages (voir
// main.tsx) — ce helper construit une URL d'asset statique cohérente avec
// les deux, pour aller chercher un fichier dans public/ (ex: une photo).
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${path}`.replace(/([^:]\/)\/+/g, "$1");
}
