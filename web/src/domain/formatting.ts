// Portage de Domain/CocktailFormatting.swift : "6.0" -> "6", "0.5" -> "0.5".
export function formatQuantity(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100).replace(/\.?0+$/, (m) => (m.includes(".") ? "" : m));
}

export function formatDifficulty(difficulty: 1 | 2 | 3): string {
  return ["Facile", "Intermédiaire", "Avancé"][difficulty - 1] ?? "Facile";
}

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
