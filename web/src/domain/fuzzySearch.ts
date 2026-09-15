function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

// Tolérance de fautes de frappe proportionnelle à la longueur du mot tapé —
// trop courte pour être fiable en dessous de 4 caractères.
function typoTolerance(length: number): number {
  if (length <= 3) return 0;
  if (length <= 6) return 1;
  return 2;
}

/**
 * Recherche insensible aux accents (ex: "cafe" retrouve "Café") et
 * tolérante aux fautes de frappe légères (distance de Levenshtein
 * mot à mot, ex: "mojto" retrouve "Mojito") — sans dépendance externe,
 * le catalogue est assez petit pour comparer en clair à chaque frappe.
 */
export function fuzzyIncludes(query: string, text: string): boolean {
  const q = normalizeForSearch(query);
  if (!q) return true;
  const t = normalizeForSearch(text);
  if (t.includes(q)) return true;

  const tolerance = typoTolerance(q.length);
  if (tolerance === 0) return false;

  const words = t.split(/[\s'-]+/).filter(Boolean);
  return words.some((word) => Math.abs(word.length - q.length) <= tolerance && levenshtein(q, word) <= tolerance);
}
