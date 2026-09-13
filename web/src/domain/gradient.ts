/** Sélection déterministe par jour de l'année — même principe que le widget "Suggestion du jour" iOS (Sprint 9), repris ici comme mise en avant d'accueil plutôt que comme widget. */
export function dailyPick<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  return items[dayOfYear % items.length];
}

export function gradientClassFor(category: string): string {
  switch (category.toLowerCase()) {
    case "tropical":
    case "tiki":
      return "gradient-tropical";
    case "classique":
    case "spiritueux":
      return "gradient-classique";
    case "frais":
    case "menthe":
      return "gradient-frais";
    case "agrumes":
      return "gradient-agrumes";
    case "sans alcool":
      return "gradient-sansalcool";
    case "hiver":
    case "fêtes":
      return "gradient-hiver";
    default:
      return "gradient-default";
  }
}
