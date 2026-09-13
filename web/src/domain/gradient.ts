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
