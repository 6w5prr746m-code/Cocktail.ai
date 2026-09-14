// Convertit chaque JPEG/PNG déposé dans public/images/cocktails/ en deux
// variantes WebP (voir CocktailVisual.tsx) puis supprime le fichier source
// — seuls les .webp finaux sont conservés dans le repo.
//
// Usage : coller la photo générée (Gemini/Imagen) sous
// public/images/cocktails/<id-du-cocktail>.jpg, puis lancer ce script.
import sharp from "sharp";
import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const SRC_DIR = "public/images/cocktails";
const VARIANTS = [
  { suffix: "", width: 960, quality: 82 }, // fiche détail / cocktail du jour
  { suffix: "-thumb", width: 480, quality: 78 }, // cartes / listes
];

const files = (await readdir(SRC_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f));

if (files.length === 0) {
  console.log("Aucun JPEG/PNG à convertir dans", SRC_DIR);
  process.exit(0);
}

for (const file of files) {
  const id = file.replace(/\.(jpe?g|png)$/i, "");
  const srcPath = path.join(SRC_DIR, file);
  const beforeSize = (await stat(srcPath)).size;
  let afterSize = 0;

  for (const variant of VARIANTS) {
    const outPath = path.join(SRC_DIR, `${id}${variant.suffix}.webp`);
    await sharp(srcPath).resize({ width: variant.width, withoutEnlargement: true }).webp({ quality: variant.quality }).toFile(outPath);
    afterSize += (await stat(outPath)).size;
  }

  await rm(srcPath);
  console.log(`${file} → ${id}.webp + ${id}-thumb.webp (${(beforeSize / 1024).toFixed(0)} Ko → ${(afterSize / 1024).toFixed(0)} Ko)`);
}
